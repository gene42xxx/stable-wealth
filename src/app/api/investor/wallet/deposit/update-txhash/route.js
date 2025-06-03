import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

// POST /api/investor/wallet/deposit/update-txhash
// Called by the frontend if waitForTransactionReceipt returns a different hash
// than the one initially submitted. This handles transaction replacements (speed up/cancel).
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { originalTxHash, confirmedTxHash, networkId } = body;
    const userId = session.user.id;

    // Basic validation
    if (!originalTxHash || typeof originalTxHash !== 'string' || !originalTxHash.startsWith('0x')) {
        return NextResponse.json({ message: 'Invalid or missing originalTxHash' }, { status: 400 });
    }
    if (!confirmedTxHash || typeof confirmedTxHash !== 'string' || !confirmedTxHash.startsWith('0x')) {
        return NextResponse.json({ message: 'Invalid or missing confirmedTxHash' }, { status: 400 });
    }
    if (originalTxHash.toLowerCase() === confirmedTxHash.toLowerCase()) {
         return NextResponse.json({ message: 'Original and confirmed hashes are the same, no update needed.' }, { status: 400 });
    }
     // Optional: Validate networkId if needed for multi-chain scenarios

    console.log(`Attempting to update tx hash for user ${userId}. Original: ${originalTxHash}, Confirmed: ${confirmedTxHash}`);

    try {
        // Find the pending transaction using the ORIGINAL hash for this user
        const updateResult = await Transaction.findOneAndUpdate(
            {
                user: userId,
                txHash: originalTxHash, // Match the hash initially sent
                status: 'pending'       // Only update pending transactions
            },
            {
                $set: {
                    txHash: confirmedTxHash, // Update to the hash that was actually confirmed
                    'logs.hashUpdate': `Original hash ${originalTxHash} replaced by ${confirmedTxHash} on ${new Date().toISOString()}` // Add a log entry
                }
            },
            { new: true } // Return the updated document (optional)
        );

        if (updateResult) {
            console.log(`Successfully updated txHash for transaction ID ${updateResult._id} from ${originalTxHash} to ${confirmedTxHash}`);
            return NextResponse.json({ message: 'Transaction hash updated successfully.', transactionId: updateResult._id }, { status: 200 });
        } else {
            console.warn(`No pending transaction found for user ${userId} with original hash ${originalTxHash} to update.`);
            // Check if it was already updated or completed with the *confirmed* hash by the verification service
            const alreadyProcessed = await Transaction.findOne({
                user: userId,
                txHash: confirmedTxHash,
                status: { $in: ['completed', 'failed'] }
            });
            if (alreadyProcessed) {
                 console.log(`Transaction with confirmed hash ${confirmedTxHash} was already processed (status: ${alreadyProcessed.status}). No update needed.`);
                 return NextResponse.json({ message: 'Transaction already processed with the confirmed hash.' }, { status: 200 }); // Or 409 Conflict? 200 seems ok.
            }

            return NextResponse.json({ message: 'Pending transaction with original hash not found.' }, { status: 404 });
        }

    } catch (error) {
        console.error(`Error updating transaction hash from ${originalTxHash} to ${confirmedTxHash} for user ${userId}:`, error);
        return NextResponse.json({ message: 'Database error during transaction hash update', error: error.message }, { status: 500 });
    }
}
