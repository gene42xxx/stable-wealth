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
