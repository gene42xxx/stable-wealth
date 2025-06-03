// src/app/api/admin/token-approvals/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import TokenApproval from '@/models/TokenApproval';
import mongoose from 'mongoose';

/**
 * GET /api/admin/token-approvals/{id}
 * Fetches a specific token approval record by its ID, based on user role.
 * - Super Admins: Can get any record by ID.
 * - Admins: Can only get records for users they created.
 */
export async function GET(req, { params }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params; // Extract the ID from the route parameters

    if (!session || !session.user || !['admin', 'super-admin'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid Token Approval ID format' }, { status: 400 });
    }

    try {
        const approval = await TokenApproval.findById(id).populate({
            path: 'user',
            select: 'name email walletAddress referredByAdmin' // Ensure referredByAdmin is selected
        });

        if (!approval) {
            return NextResponse.json({ message: 'Token Approval not found' }, { status: 404 });
        }

        // Authorization check for Admins
        if (session.user.role === 'admin') {
            // Check if the approval's user was referred by this admin
            // Note: approval.user might be null if the user was deleted, handle this case
            if (!approval.user || !approval.user.referredByAdmin || approval.user.referredByAdmin.toString() !== session.user.id) {
                // Fetch the admin's createdUsers list as a fallback/alternative check
                // Ensure the User model is correctly imported if this check is needed often
                const adminUser = await User.findById(session.user.id).select('createdUsers');
                // Add null check for adminUser if necessary
                const createdUserIds = adminUser ? adminUser.createdUsers.map(uid => uid.toString()) : [];

                // Check if approval.user exists before accessing its _id
                if (!approval.user || !createdUserIds.includes(approval.user._id.toString())) {
                    return NextResponse.json({ message: 'Forbidden: You can only view approvals for users you created.' }, { status: 403 });
                }
            }
        }

        // If super-admin or authorized admin, return the approval

        // --- MODIFICATION START ---
        // Remove the lines that excluded referredByAdmin.
        // Simply convert the entire populated document to a plain object.
        // Mongoose's .toObject() typically handles populated fields correctly by default.
        const finalApproval = approval.toObject();
        // --- MODIFICATION END ---


        // The finalApproval object now includes the 'user' object as populated,
        // including the 'referredByAdmin' field because we didn't remove it.
        return NextResponse.json(finalApproval, { status: 200 });

    } catch (error) {
        console.error(`Error fetching token approval ${id}:`, error);
        // Distinguish between not found due to invalid ID format vs other errors
        if (error.kind === 'ObjectId') {
            return NextResponse.json({ message: 'Invalid Token Approval ID format' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}