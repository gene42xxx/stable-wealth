import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from '@/lib/utils/logActivity';
import { createPublicClient, createWalletClient, http, privateKeyToAccount, getAddress, parseUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

// ABI snippet for processDirectDeposit (needed for type definition, even if not called here)
const LUXE_ABI_PROCESS_DEPOSIT = [
  {
    name: 'processDirectDeposit',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'txHash', type: 'bytes32' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const USDT_DECIMALS = 6;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

if (!ADMIN_PRIVATE_KEY) {
    console.error("Error: ADMIN_PRIVATE_KEY environment variable is not set!");
}
if (!CONTRACT_ADDRESS) {
    console.error("Error: NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set!");
}


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

// PUT handler to update a specific transaction by ID
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id: transactionId } = params;

    if (!session || !session.user || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
        return NextResponse.json({ message: 'Invalid transaction ID format' }, { status: 400 });
    }

    await connectMongoDB();

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { status, blockchainData } = body; // Only expect status and blockchainData for generic update

    try {
        let transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Generic update for other statuses or fields
        if (status) {
            transaction.status = status;
        }
        if (blockchainData) {
            transaction.blockchainData = { ...transaction.blockchainData, ...blockchainData };
        }
        // Add other fields to update as needed
        // e.g., if (body.amount) transaction.amount = body.amount;
        // if (body.currency) transaction.currency = body.currency;
        await logActivity(
            session.user.id,
            'TRANSACTION_UPDATED_MANUALLY',
            `Admin manually updated transaction ${transactionId} to status: ${status || 'N/A'}.`
        );

        await transaction.save();
        return NextResponse.json({ message: 'Transaction updated successfully', transaction }, { status: 200 });

    } catch (error) {
        console.error(`Error updating transaction ${transactionId}:`, error);
        return NextResponse.json({ message: 'Error updating transaction', error: error.message }, { status: 500 });
    }
}
