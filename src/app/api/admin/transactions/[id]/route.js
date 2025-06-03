import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed

// GET handler to fetch transactions for a specific user ID, accessible by the admin who created them
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id: targetUserId } = params; // The ID of the user whose transactions are requested

  if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    await connectMongoDB();

    // Super-admin can access any user's transactions without authorization check
    if (session.user.role === 'super-admin') {
      // Fetch transactions for the target user without additional authorization
      const transactions = await Transaction.find({ user: targetUserId })
                                            .populate('user', 'name email')
                                            .sort({ createdAt: -1 });

      return NextResponse.json({ transactions: transactions || [] }, { status: 200 });
    }

    // For regular admins, check if they created the user
    const adminUser = await User.findById(session.user.id).select('createdUsers').lean();

    // Ensure the admin exists and has created users
    if (!adminUser || !adminUser.createdUsers) {
        return NextResponse.json({ message: 'Unauthorized: Admin data not found or no users created' }, { status: 403 });
    }

    // Check if the targetUserId is in the list of users created by this admin
    const isAuthorized = adminUser.createdUsers.some(createdUserId => createdUserId.equals(targetUserId));

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden: You did not create this user' }, { status: 403 });
    }

    // Fetch transactions specifically for the target user
    // Add pagination or filtering as needed
    const transactions = await Transaction.find({ user: targetUserId })
                                          .populate('user', 'name email') // Populate user details
                                          .sort({ createdAt: -1 });

    if (!transactions) {
        // This case might mean the user exists but has no transactions
        return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching transactions for user ${targetUserId}:`, error);
    return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
  }
}

// Other methods (POST, PUT, DELETE) might be relevant if admins need to modify specific transactions
// For now, only GET is implemented based on the request.
