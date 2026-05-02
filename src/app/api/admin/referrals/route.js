import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import connectDB from '@/lib/mongodb'; // Adjust path as needed
import User from '@/models/User';
import ReferralCode from '@/models/ReferralCode';
import crypto from 'crypto';
import APIFeatures from '@/lib/utils/apiFeatures'; // Import APIFeatures

// Helper function to generate a unique referral code with role-specific prefixes
async function generateUniqueReferralCode(targetRole) {
    let code;
    let isUnique = false;
    let prefix = '';

    // Set prefix based on the target role
    if (targetRole === 'admin') {
        prefix = 'ADMIN-';
    } else if (targetRole === 'user') {
        prefix = 'USER-'; // USER for Investor
    }

    while (!isUnique) {
        // Generate a random code (6 characters)
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        code = prefix + randomPart;

        // Check if this code already exists in the database
        const existingCode = await ReferralCode.findOne({ code });
        if (!existingCode) {
            isUnique = true;
        }
    }

    return code;
}

// get referral codes
export async function GET(request) {
    const session = await getServerSession(authOptions);

    // Basic authorization: Check if user is logged in and is an admin/super-admin
    if (!session || !['admin', 'super-admin'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const queryString = Object.fromEntries(searchParams.entries());

        // --- Define Base Query based on Role ---
        let baseQuery = ReferralCode.find(); // Start with base Mongoose query
        if (session.user.role === 'admin') {
            if (!session.user.id) {
                 return NextResponse.json({ message: 'Admin user ID not found in session' }, { status: 400 });
            }
            baseQuery = baseQuery.where('createdBy').equals(session.user.id);
        }
        // Super-admins see all by default

        // --- Apply APIFeatures ---
        // Note: 'search' isn't implemented here, but could be added for 'code' field if needed.
        // Filters like 'targetRole' or 'isUsed' can be passed via queryString.
        const features = new APIFeatures(baseQuery, queryString)
            .filter() // Apply filters like ?targetRole=user or ?isUsed=false
            .sort()   // Defaults to -createdAt
            .limitFields() // Defaults to -__v
            .paginate(); // Defaults to page 1, limit 100

        // --- Execute Query ---
        const referrals = await features.query
            .populate('createdBy', 'id name email') // Populate creator's details
            .populate('usedBy', 'id name email'); // Populate user's details

        // TODO: Add total count for pagination if needed on the frontend
        // const totalReferrals = await ReferralCode.countDocuments(baseQuery.getFilter());

        return NextResponse.json({ referrals }, { status: 200 }); // Return in object

    } catch (error) {
        console.error("Error fetching referral codes:", error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// 
export async function POST(request) {
    const session = await getServerSession(authOptions);

    // 1. Authentication Check: Ensure user is logged in
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const loggedInUserId = session.user.id;
        const loggedInUserRole = session.user.role;

        // Optional: Get expiry date from request body (e.g., number of days from now)
        const { expiresInDays, targetRole } = await request.json().catch(() => ({})); // Default if no body or invalid JSON
        let expiresAt = new Date(); // Default to now
        if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        } else {
            // Default to 24 hours from now if no valid expiresInDays is provided
            expiresAt.setHours(expiresAt.getHours() + 24);
        }


        // 2. Authorization Check & Determine Target Role: Based on creator's role
        if (!['super-admin', 'admin'].includes(loggedInUserRole)) {
            // Only super-admin and admin can create referral codes
            return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }
        
     

        // 3. Generate and Save Code with appropriate prefix
        const newCodeValue = await generateUniqueReferralCode(targetRole);
        // Validate that only super-admin can create admin referral codes
        if (targetRole === 'admin' && loggedInUserRole !== 'super-admin') {
            return NextResponse.json({ message: 'Forbidden: Only super-admin can create admin referral codes' }, { status: 403 });
        }

        const newReferralCode = new ReferralCode({
            code: newCodeValue,
            createdBy: loggedInUserId,
            targetRole: targetRole,
            expiresAt: expiresAt, // Set expiry if provided
        });

        await newReferralCode.save();

        return NextResponse.json({ message: `Referral code for ${targetRole} created successfully`, referralCode: newReferralCode }, { status: 201 });
    } catch (error) {
        console.error("Referral Code Creation API Error:", error);
        return NextResponse.json({ message: 'An error occurred during referral code creation', error: error.message }, { status: 500 });
    }
}
