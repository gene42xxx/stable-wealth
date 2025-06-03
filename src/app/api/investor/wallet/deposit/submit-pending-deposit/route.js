import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path to your authOptions
import connectDB from '@/lib/mongodb'; // Adjust path
import Transaction from '@/models/Transaction'; // Adjust path to your Transaction model
import User from '@/models/User'; // Import User model
import mongoose from 'mongoose';
import { isAddress } from 'viem';

export async function POST(request) {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Parse request body
    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    // Destructure depositorAddress as well
    const { txHash, amount, currency, networkId, depositorAddress } = body;

    // 3. Validate required inputs
    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
        return NextResponse.json({ message: 'Invalid or missing transaction hash (txHash)' }, { status: 400 });
    }
    // Ensure amount is a positive number
    if (amount == null || typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
        return NextResponse.json({ message: 'Invalid or missing amount (must be a positive number)' }, { status: 400 });
    }
    if (!currency || typeof currency !== 'string' || currency.trim() === '') {
        return NextResponse.json({ message: 'Invalid or missing currency' }, { status: 400 });
    }
    // networkId can reasonably be a number (like a chain ID)
    if (networkId == null || typeof networkId !== 'number') {
        return NextResponse.json({ message: 'Invalid or missing network ID (networkId)' }, { status: 400 });
    }
    // Validate depositorAddress (basic check for string and 0x prefix)
    if (!depositorAddress || typeof depositorAddress !== 'string' || !isAddress(depositorAddress)) {
        return NextResponse.json({ message: 'Invalid or missing depositor address (depositorAddress)' }, { status: 400 });
    }

    // 4. Connect to Database
    await connectDB();

    try {
        // --- Start: Update User Wallet Address if needed ---
        const user = await User.findById(userId).select('walletAddress'); // Fetch user, only select walletAddress
        if (!user) {
            // Should not happen if session is valid, but good practice
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!user.walletAddress) {
            // User's wallet address is not set, update it
            console.log(`User ${userId} has no walletAddress. Setting to ${depositorAddress}`);
            user.walletAddress = depositorAddress;
            await user.save(); // Save the updated user document
            console.log(`User ${userId} walletAddress updated successfully.`);
        } else {
            // Optional: Log if the provided address differs from the stored one, might indicate an issue
            if (user.walletAddress.toLowerCase() !== depositorAddress.toLowerCase()) {
                console.warn(`Depositor address ${depositorAddress} provided for user ${userId} differs from stored address ${user.walletAddress}. Stored address will NOT be changed.`);
                // Decide if you want to block the transaction or just warn.
                // For now, we just warn and proceed, as the primary goal is to set it *if empty*.
            }
        }
        // --- End: Update User Wallet Address if needed ---


        // 5. Check if this transaction has ALREADY been finalized
        // Prevents issues if frontend somehow calls this after completion or for an old tx
        const existingFinalTransaction = await Transaction.findOne({
            txHash: txHash,
            status: { $in: ['completed', 'failed', 'cancelled'] } // Check for any terminal status
        });

        if (existingFinalTransaction) {
            console.warn(`Attempt to submit pending deposit for already finalized txHash: ${txHash} by user ${userId}. Status: ${existingFinalTransaction.status}`);
            // Return the existing status to potentially inform the frontend
            return NextResponse.json({
                message: `Transaction has already been processed with status: ${existingFinalTransaction.status}`,
                existingStatus: existingFinalTransaction.status,
                transactionId: existingFinalTransaction._id
            }, { status: 409 }); // 409 Conflict indicates resource already exists/processed
        }

        // Optional: Check if a 'pending' record *already* exists for this hash/user.
        // If it does, we can just return success without creating a duplicate.
        const existingPendingTransaction = await Transaction.findOne({
            txHash: txHash,
            user: userId, // Make sure it's for the same user if txHashes could theoretically collide (unlikely but safe)
            status: 'pending'
        });

        if (existingPendingTransaction) {
            console.log(`Pending deposit submission attempt for existing pending txHash: ${txHash} by user ${userId}.`);
            return NextResponse.json({
                message: 'Pending deposit already submitted. Verification is ongoing.',
                transactionId: existingPendingTransaction._id,
                status: 'pending'
            }, { status: 200 }); // 200 OK is fine here, already exists in desired state
        }


        // 6. Create the new pending transaction document
        const newPendingDeposit = new Transaction({
            user: userId,
            type: 'deposit',
            amount: amount, // Store the amount as provided by the user/frontend
            currency: currency,
            status: 'pending', // *** Set status to pending ***
            txHash: txHash,
            balanceType: 'real', // Deposits affect real balance
            blockchainData: {
                networkId: String(networkId), // Store network ID
                // Other fields like blockNumber, fromAddress will be populated later by verification
            },
            description: `Pending deposit of ${amount} ${currency}`,
            metadata: { submittedAt: new Date() } // Optional: track submission time
        });

        // 7. Save to Database
        const savedTransaction = await newPendingDeposit.save();
        console.log(`Pending deposit submitted successfully for user ${userId}, txHash: ${txHash}, DB ID: ${savedTransaction._id}`);

        // 8. Return Success Response
        return NextResponse.json({
            message: 'Pending deposit submitted successfully. Verification will occur.',
            transactionId: savedTransaction._id, // Return the new DB document ID
            status: savedTransaction.status
        }, { status: 201 }); // 201 Created

    } catch (dbError) {
        console.error("Error processing submit-pending-deposit:", dbError);
        // Handle potential unique index collision on txHash if you have one
        if (dbError.code === 11000 && dbError.keyPattern?.txHash) {
            console.warn(`Database unique key collision for txHash: ${txHash}`);
            // It's likely another request created it just now, or it exists with a different status we missed
            // We can try to find it again just to be sure
            const conflictingTx = await Transaction.findOne({ txHash: txHash });
            if (conflictingTx) {
                return NextResponse.json({
                    message: `Transaction already exists with status: ${conflictingTx.status}`,
                    existingStatus: conflictingTx.status,
                    transactionId: conflictingTx._id
                }, { status: 409 }); // Conflict
            }
        }
        // Generic database error
        return NextResponse.json({ message: 'Database error during submission', error: dbError.message }, { status: 500 });
    }
}
