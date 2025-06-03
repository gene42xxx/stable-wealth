// src/app/api/investor/wallet/withdraw/update-hash/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    // 1. Authentication
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let pendingTransactionId, txHash;
    try {
        // 2. Parse and Validate Input
        const body = await request.json();
        pendingTransactionId = body.pendingTransactionId;
        txHash = body.txHash;

        if (!pendingTransactionId || !mongoose.Types.ObjectId.isValid(pendingTransactionId)) {
            return NextResponse.json({ message: 'Invalid Pending Transaction ID' }, { status: 400 });
        }
        // Basic hash validation (Ethereum hash format)
        if (!txHash || typeof txHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            return NextResponse.json({ message: 'Invalid Transaction Hash format' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    await connectDB();

    try {
        // 3. Find the specific pending transaction for the user
        const transaction = await Transaction.findOne({
            _id: pendingTransactionId,
            user: session.user.id,
            type: 'withdrawal', // Ensure it's a withdrawal
            status: { $in: ['pending', 'pending_signature'] } // Should be in a state expecting a hash
        });

        if (!transaction) {
            console.warn(`Update Hash API: Pending withdrawal transaction not found or not updatable for ID: ${pendingTransactionId}, User: ${session.user.id}`);
            // Return 404, maybe the transaction was already processed or cancelled
            return NextResponse.json({ message: 'Pending withdrawal transaction not found or not in an updatable state' }, { status: 404 });
        }

        // 4. Update the transaction hash
        transaction.txHash = txHash;
        // Optionally update status if it was 'pending_signature'
        if (transaction.status === 'pending_signature') {
            transaction.status = 'pending'; // Now it's truly pending on-chain confirmation
        }
        await transaction.save();

        console.log(`Successfully updated txHash for Transaction ID: ${pendingTransactionId} to ${txHash}`);
        return NextResponse.json({ message: 'Transaction hash updated successfully', transactionId: transaction._id }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating transaction hash for ID ${pendingTransactionId}:`, error);
        return NextResponse.json({ message: 'Error updating transaction hash', error: error.message }, { status: 500 });
    }
}
