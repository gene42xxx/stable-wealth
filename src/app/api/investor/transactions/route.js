import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import APIFeatures from '@/lib/utils/apiFeatures';
import User from '@/models/User'; // Import User model

// GET /api/investor/transactions - Fetch transactions for the logged-in user with filtering, sorting, etc.
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const userId = session.user.id;
        const query = Transaction.find({ user: userId });

        // Use APIFeatures utility
        const apiFeatures = new APIFeatures(query, request.nextUrl.searchParams);
        // Apply filtering and searching first to get the correct filter object for counting
        const featuresForCount = new APIFeatures(Transaction.find({ user: userId }), request.nextUrl.searchParams);
        featuresForCount.filter().search(['type', 'status', 'description']);
        const filterForCount = featuresForCount.query.getFilter(); // Get the filter conditions including user and search/filter

        // Apply all features for the actual data query
        const featuresForData = new APIFeatures(Transaction.find({ user: userId }), request.nextUrl.searchParams);
        featuresForData.filter().sort().limitFields().paginate().search(['type', 'status', 'description']);

        // Execute queries
        const transactions = await featuresForData.query.lean();
        // Use the filter conditions derived earlier for an accurate count
        const totalCount = await Transaction.countDocuments(filterForCount);

        return NextResponse.json({
            results: transactions.length, // Add the count of results on the current page
            transactions,
            pagination: {
                total: totalCount,
                page: parseInt(request.nextUrl.searchParams.get('page') || '1', 10),
                limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
            }
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
    }
}

// POST /api/investor/transactions - Create a new transaction for the logged-in user
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const userId = session.user.id;
        const body = await request.json();

        // Validate required fields for transaction creation
        const { type, amount, currency, status, txHash, description, balanceType, blockchainData } = body;

        if (!type || !amount || !balanceType) {
            return NextResponse.json({ message: 'Missing required transaction fields: type, amount, balanceType' }, { status: 400 });
        }

        // Ensure the user exists (though session implies they do)
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const newTransaction = new Transaction({
            user: userId,
            type,
            amount,
            currency: currency || 'USDT', // Default to USDT if not provided
            status: status || 'pending', // Default to pending if not provided
            txHash,
            description,
            balanceType,
            blockchainData: blockchainData ? {
                networkId: blockchainData.networkId,
                blockNumber: blockchainData.blockNumber,
                confirmations: blockchainData.confirmations,
                networkFee: blockchainData.networkFee
            } : undefined, // Ensure blockchainData is only added if it exists
            metadata: body.metadata // Allow arbitrary metadata
        });

        await newTransaction.save();

        return NextResponse.json({ message: 'Transaction created successfully', transaction: newTransaction }, { status: 201 });

    } catch (error) {
        console.error("Error creating investor transaction:", error);
        return NextResponse.json({ message: 'Error creating transaction', error: error.message }, { status: 500 });
    }
}
