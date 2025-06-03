import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import TokenApproval from '@/models/TokenApproval';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/investor/wallet/update-txhash
// Updates the transaction hash for a pending record if it changed (e.g., due to speed up)
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const body = await request.json();
        const { originalTxHash, confirmedTxHash, networkId } = body;

        if (!originalTxHash || !confirmedTxHash || !networkId) {
            return NextResponse.json({ message: 'Missing required fields (originalTxHash, confirmedTxHash, networkId)' }, { status: 400 });
        }

        if (originalTxHash.toLowerCase() === confirmedTxHash.toLowerCase()) {
             return NextResponse.json({ message: 'Hashes are the same, no update needed.' }, { status: 200 });
        }

        console.log(`Attempting to update hash for user ${session.user.id}. Original: ${originalTxHash}, Confirmed: ${confirmedTxHash}`);

        let updated = false;
        let itemType = 'unknown';

        // Try updating a pending Transaction first
        const updatedTransaction = await Transaction.findOneAndUpdate(
            {
                user: session.user.id,
                txHash: originalTxHash,
                status: 'pending', // Only update pending ones
                // Optional: Add networkId check if relevant for transactions
                // networkId: networkId,
            },
            { $set: { txHash: confirmedTxHash } },
            { new: false } // Return null if not found or already updated
        );

        if (updatedTransaction) {
            updated = true;
            itemType = 'transaction';
            console.log(`Successfully updated txHash for Transaction ID: ${updatedTransaction._id}`);
        } else {
            // If not found as a transaction, try updating a pending TokenApproval
            const updatedApproval = await TokenApproval.findOneAndUpdate(
                {
                    user: session.user.id,
                    transactionHash: originalTxHash,
                    status: 'pendingApproval', // Only update pending ones
                    // Optional: Add networkId check if relevant for approvals
                    // 'blockchainData.networkId': networkId, // Assuming networkId is stored here
                },
                { $set: { transactionHash: confirmedTxHash } },
                { new: false }
            );

            if (updatedApproval) {
                updated = true;
                itemType = 'approval';
                console.log(`Successfully updated transactionHash for TokenApproval ID: ${updatedApproval._id}`);
            }
        }

        if (updated) {
            return NextResponse.json({ message: `Successfully updated hash for pending ${itemType}.` }, { status: 200 });
        } else {
            console.warn(`No matching pending transaction or approval found for user ${session.user.id} with original hash ${originalTxHash}. It might have already been processed or the original hash was incorrect.`);
            return NextResponse.json({ message: 'No matching pending record found to update.' }, { status: 404 });
        }

    } catch (error) {
        console.error("API Error updating transaction hash:", error);
        return NextResponse.json({ message: 'Error updating transaction hash', error: error.message }, { status: 500 });
    }
}
