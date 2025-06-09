import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

// GET /api/investor/transactions/:id - Fetch a specific transaction by ID for the logged-in user
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const userId = session.user.id;
        const transactionId = params.id;

        const transaction = await Transaction.findOne({ _id: transactionId, user: userId }).lean();

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json(transaction, { status: 200 });
    } catch (error) {
        console.error("Error fetching transaction by ID:", error);
        return NextResponse.json({ message: 'Error fetching transaction', error: error.message }, { status: 500 });
    }
}

// POST /api/investor/transactions/:id - Update a specific transaction by ID for the logged-in user

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    // Use txHash from params as the identifier
    const txHash = params.id;

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    // Validate txHash format if necessary, but don't treat it as ObjectId
    if (!txHash || typeof txHash !== 'string') {
         return NextResponse.json({ message: 'Invalid transaction hash format' }, { status: 400 });
    }

    try {
        await connectDB();

        const userId = session.user.id;
        // Find transaction by txHash instead of _id
        const transaction = await Transaction.findOne({ txHash: txHash, user: userId });

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        const body = await request.json();
        const { status, blockchainData, description } = body; // Added description

        if (status) {
            transaction.status = status;
        }
        if (blockchainData) {
            transaction.blockchainData = { ...transaction.blockchainData, ...blockchainData };
        }
         if (description) { // Added description update
            transaction.description = description;
        }


        await transaction.save();
        return NextResponse.json({ message: 'Transaction updated successfully', transaction }, { status: 200 });
    } catch (error) {
        console.error("Error updating transaction by txHash:", error);
        return NextResponse.json({ message: 'Error updating transaction', error: error.message }, { status: 500 });
    }
}
