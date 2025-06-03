import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

// POST /api/investor/wallet/withdraw/confirm - Step 2: Confirm withdrawal after successful blockchain transaction
export async function POST(request) {
    console.log("Received withdrawal confirmation request...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const body = await request.json();
        const { pendingTransactionId, txHash, networkId } = body;
        const userId = session.user.id;

        console.log(`Confirmation for User ID: ${userId}, Pending Tx ID: ${pendingTransactionId}, Hash: ${txHash}, Network: ${networkId}`);

        if (!pendingTransactionId || !txHash || !networkId) {
            console.warn("Confirmation failed: Missing required fields", body);
            return NextResponse.json({ message: 'Invalid confirmation details: pendingTransactionId, txHash, and networkId required' }, { status: 400 });
        }

        // Validate ObjectId format before querying
        if (!mongoose.Types.ObjectId.isValid(pendingTransactionId)) {
             console.warn(`Confirmation failed: Invalid pendingTransactionId format: ${pendingTransactionId}`);
             return NextResponse.json({ message: 'Invalid transaction ID format' }, { status: 400 });
        }

        // Find the pending transaction
        const transaction = await Transaction.findById(pendingTransactionId);

        if (!transaction) {
            console.warn(`Confirmation failed: Transaction not found for ID: ${pendingTransactionId}`);
            return NextResponse.json({ message: 'Pending transaction not found' }, { status: 404 });
        }

        // Security Check: Ensure the transaction belongs to the logged-in user
        if (transaction.user?.toString() !== userId) {
            console.warn(`Confirmation failed: Transaction ${pendingTransactionId} does not belong to user ${userId}`);
            return NextResponse.json({ message: 'Unauthorized to confirm this transaction' }, { status: 403 });
        }

        // Check if the transaction is in the correct state
        if (transaction.status !== 'pending') {
            console.warn(`Confirmation failed: Transaction ${pendingTransactionId} is not in 'pending_signature' state. Current state: ${transaction.status}`);
            // If already completed or failed, maybe return success? Or a specific message.
            if (transaction.status === 'completed' || transaction.status === 'processing') {
                 return NextResponse.json({ message: 'Transaction already confirmed or processing' }, { status: 200 });
            }
            return NextResponse.json({ message: `Transaction is not awaiting confirmation (status: ${transaction.status})` }, { status: 400 });
        }

        // --- Update Transaction ---
        transaction.status = 'completed'; // Or 'processing' if further steps needed
        transaction.txHash = txHash;
        // Ensure blockchainData exists before adding properties
        transaction.blockchainData = transaction.blockchainData || {};
        transaction.blockchainData.networkId = networkId;
        transaction.metadata.confirmedAt = new Date(); // Add confirmation timestamp

        // Use MongoDB transaction for atomicity (optional but good practice)
        const mongoSession = await mongoose.startSession();
        let savedTransaction;
        try {
            await mongoSession.withTransaction(async () => {
                savedTransaction = await transaction.save({ session: mongoSession });
                // TODO: Add any other necessary updates here, e.g.,
                // - Update user's actual balance if tracked separately
                // - Trigger notifications
                // - Log activity
                console.log(`Withdrawal transaction ${savedTransaction._id} confirmed successfully for User ${userId}.`);
            });
        } catch (error) {
            console.error("Confirmation DB Transaction Error:", error);
            return NextResponse.json({ message: 'Confirmation failed during database update', error: error.message }, { status: 500 });
        } finally {
            await mongoSession.endSession();
        }

         if (!savedTransaction) {
             console.error("Failed to save confirmed transaction after session commit for User:", userId);
             return NextResponse.json({ message: 'Confirmation failed after database update' }, { status: 500 });
        }

        // --- Respond to Frontend ---
        console.log(`Confirmation successful for User ${userId}, Transaction ID: ${savedTransaction._id}`);
        return NextResponse.json({
            success: true,
            message: 'Withdrawal confirmed successfully',
            transaction: savedTransaction // Return the updated transaction
        }, { status: 200 });

    } catch (error) {
        console.error("API Error confirming withdrawal:", error);
        return NextResponse.json({ message: 'Error confirming withdrawal', error: error.message }, { status: 500 });
    }
}
