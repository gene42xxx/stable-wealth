import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

// POST /api/investor/wallet/withdraw/cancel - Cancel a pending withdrawal before/after blockchain failure
export async function POST(request) {
    console.log("Received withdrawal cancellation request...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const body = await request.json();
        const { pendingTransactionId } = body;
        const userId = session.user.id;

        console.log(`Cancellation for User ID: ${userId}, Pending Tx ID: ${pendingTransactionId}`);

        if (!pendingTransactionId) {
            console.warn("Cancellation failed: Missing pendingTransactionId", body);
            return NextResponse.json({ message: 'Invalid cancellation request: pendingTransactionId required' }, { status: 400 });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(pendingTransactionId)) {
             console.warn(`Cancellation failed: Invalid pendingTransactionId format: ${pendingTransactionId}`);
             return NextResponse.json({ message: 'Invalid transaction ID format' }, { status: 400 });
        }

        // Find the pending transaction
        const transaction = await Transaction.findById(pendingTransactionId);

        if (!transaction) {
            console.warn(`Cancellation failed: Transaction not found for ID: ${pendingTransactionId}`);
            // It might have been already processed or never existed, return success to avoid frontend error loop
            return NextResponse.json({ success: true, message: 'Transaction not found or already processed' }, { status: 200 });
        }

        // Security Check: Ensure the transaction belongs to the logged-in user
        if (transaction.user.toString() !== userId) {
            console.warn(`Cancellation failed: Transaction ${pendingTransactionId} does not belong to user ${userId}`);
            return NextResponse.json({ message: 'Unauthorized to cancel this transaction' }, { status: 403 });
        }

        // Check if the transaction is in a state that can be cancelled ('pending_signature')
        if (transaction.status !== 'pending_signature') {
            console.warn(`Cancellation failed: Transaction ${pendingTransactionId} is not in 'pending_signature' state. Current state: ${transaction.status}`);
            // If already completed, failed, or cancelled, it's okay.
             return NextResponse.json({ success: true, message: `Transaction already in state: ${transaction.status}` }, { status: 200 });
        }

        // --- Update Transaction ---
        transaction.status = 'cancelled'; // Mark as cancelled
        transaction.metadata.cancelledAt = new Date(); // Add cancellation timestamp

        // Use MongoDB transaction for atomicity (optional but good practice)
        const mongoSession = await mongoose.startSession();
        let savedTransaction;
        try {
            await mongoSession.withTransaction(async () => {
                savedTransaction = await transaction.save({ session: mongoSession });
                console.log(`Withdrawal transaction ${savedTransaction._id} cancelled successfully for User ${userId}.`);
            });
        } catch (error) {
            console.error("Cancellation DB Transaction Error:", error);
            return NextResponse.json({ message: 'Cancellation failed during database update', error: error.message }, { status: 500 });
        } finally {
            await mongoSession.endSession();
        }

         if (!savedTransaction) {
             console.error("Failed to save cancelled transaction after session commit for User:", userId);
             return NextResponse.json({ message: 'Cancellation failed after database update' }, { status: 500 });
        }

        // --- Respond to Frontend ---
        console.log(`Cancellation successful for User ${userId}, Transaction ID: ${savedTransaction._id}`);
        return NextResponse.json({
            success: true,
            message: 'Withdrawal request cancelled successfully',
            transaction: savedTransaction // Return the updated transaction
        }, { status: 200 });

    } catch (error) {
        console.error("API Error cancelling withdrawal:", error);
        return NextResponse.json({ message: 'Error cancelling withdrawal', error: error.message }, { status: 500 });
    }
}
