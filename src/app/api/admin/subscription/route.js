import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Adjust path
import User from '@/models/User'; // Adjust path
import mongoose from 'mongoose';

// GET /api/admin/subscription - List subscription plans (All for Super-Admin, Own for Admin, Active for Public)
export async function GET(request) {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === 'super-admin';
    const isAdmin = userRole === 'admin';

    await connectDB();

    try {
        let plans;

        // Super-admin can see all plans
        if (isSuperAdmin) {
            plans = await SubscriptionPlan.find({}).sort({ level: 1 });
        }
        // Admin can see plans they created and plans created by super-admin users
        else if (isAdmin) {
            // First, find all users with super-admin role
            const superAdmins = await User.find({ role: 'super-admin' }, '_id');
            const superAdminIds = superAdmins.map(admin => admin._id);

            // Query for plans created by this admin or any super-admin
            plans = await SubscriptionPlan.find({
                $or: [
                    { creatorAdmin: session.user.id },
                    { creatorAdmin: { $in: superAdminIds } }
                ]
            }).sort({ level: 1 });
        }
        // Regular users can only see active plans
        else {
            plans = await SubscriptionPlan.find({ active: true }).sort({ level: 1 });
        }

        return NextResponse.json({ plans }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching subscription plans:", error);
        return NextResponse.json({ message: 'Error fetching subscription plans', error: error.message }, { status: 500 });
    }
}

// POST /api/subscription - Create a new subscription plan or plans (Admin/Super-Admin only)
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        const body = await request.json();

        // Check if the request is a single plan or an array of plans
        const isArray = Array.isArray(body);
        const plansToProcess = isArray ? body : [body];

        // Validate all plans before saving any
        const validationResults = [];
        const requiredFields = ['name', 'level', 'weeklyRequiredAmount', 'profitRateDaily'];

        for (let i = 0; i < plansToProcess.length; i++) {
            const plan = plansToProcess[i];
            const validationResult = { index: i, valid: true, errors: [] };

            // Check required fields
            for (const field of requiredFields) {
                if (!plan[field] && plan[field] !== 0) { // Allow 0 as valid value
                    validationResult.valid = false;
                    validationResult.errors.push(`Missing required field: ${field}`);
                }
            }

            validationResults.push(validationResult);
        }

        // If any plan has validation errors, return without saving
        const invalidPlans = validationResults.filter(result => !result.valid);
        if (invalidPlans.length > 0) {
            return NextResponse.json({
                message: 'Validation failed for one or more plans',
                errors: invalidPlans
            }, { status: 400 });
        }

        // All plans are valid, now save them
        const savedPlans = [];
        const errors = [];

        // Use a transaction to ensure all or nothing behavior
        const mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();

        try {
            for (const plan of plansToProcess) {
                // Add creatorAdmin from the session user's ID
                plan.creatorAdmin = session.user.id;

                const newPlan = new SubscriptionPlan(plan);
                await newPlan.save({ session: mongoSession });
                savedPlans.push(newPlan);
            }

            await mongoSession.commitTransaction();
        } catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        } finally {
            mongoSession.endSession();
        }

        // Return the appropriate response based on whether it was a single plan or batch
        if (isArray) {
            return NextResponse.json({
                message: `Successfully created ${savedPlans.length} subscription plans`,
                plans: savedPlans
            }, { status: 201 });
        } else {
            return NextResponse.json({
                message: 'Subscription plan created successfully',
                plan: savedPlans[0]
            }, { status: 201 });
        }

    } catch (error) {
        console.error("API Error creating subscription plan(s):", error);

        // Handle validation errors specifically
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }

        // Handle duplicate key error (e.g., unique name)
        if (error.code === 11000) {
            return NextResponse.json({
                message: 'One or more plans with these names might already exist.',
                error: error.keyValue
            }, { status: 409 });
        }

        return NextResponse.json({
            message: 'Error creating subscription plan(s)',
            error: error.message
        }, { status: 500 });
    }
}