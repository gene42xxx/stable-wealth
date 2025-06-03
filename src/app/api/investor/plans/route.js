import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import connectDB from '@/lib/mongodb';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import User from '@/models/User'; // Import User model
import mongoose from 'mongoose';

// GET /api/investor/plans - List active plans created by the user's referring admin or any super-admin
export async function GET(request) {
    const session = await getServerSession(authOptions);

    // Authorization: Check if user is logged in and is a regular 'user'
    if (!session || !session.user || session.user.role !== 'user') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    await connectDB();

    try {
        // 1. Fetch the logged-in investor to get their referring admin
        const investor = await User.findById(userId).select('referredByAdmin').lean(); // .lean() for plain object

        if (!investor) {
             return NextResponse.json({ message: 'Investor user not found' }, { status: 404 });
        }

        const referringAdminId = investor?.referredByAdmin; // This might be null/undefined

        // 2. Find all super-admin IDs
        const superAdmins = await User.find({ role: 'super-admin' }).select('_id').lean();
        const superAdminIds = superAdmins.map(admin => admin._id);

        // 3. Construct the query
        const queryConditions = {
            active: true,
            $or: [
                // Plans created by any super-admin
                { creatorAdmin: { $in: superAdminIds } }
            ]
        };

        // Add condition for referring admin only if it exists
        if (referringAdminId) {
            queryConditions.$or.push({ creatorAdmin: referringAdminId });
        }

        // 4. Fetch only the necessary fields for the relevant plans
        const plans = await SubscriptionPlan.find(queryConditions)
            .select({
                _id: 1,
                name: 1,
                level: 1,
                weeklyRequiredAmount: 1,
                profitRateDaily: 1,
                'withdrawalConditions.minWeeks': 1, // Select nested field
                features: 1,
                bonusRateThresholds: 1 // Select the array to check its existence/length
            })
            .sort({ level: 1 })
            .lean();

         // Convert _id to string after fetching, as .lean() might still return ObjectId
         const plainPlans = plans.map(plan => ({
            ...plan,
            _id: plan._id.toString(), // Ensure _id is a string
            id: plan._id.toString(), // Keep id as string if used elsewhere, or remove if only _id is needed
            // No need to convert other fields as they were selected directly or are primitive/arrays
         }));

        return NextResponse.json({ plans: plainPlans }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching relevant subscription plans for investor:", error);
        return NextResponse.json({ message: 'Error fetching subscription plans', error: error.message }, { status: 500 });
    }
}

// POST, PUT, DELETE methods removed - Investors cannot manage plans.
