import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/utils/logActivity';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

// Define contract addresses and constants
const CONTRACT_ADDRESS = getAddress("0x4b84fbBa64a4a71F6E1bD678e711C9bE1627fD7F"); // Use getAddress for checksum
const USDT_DECIMALS = 6; // Standard USDT decimals

// Define a default deposit amount from environment variable, with a fallback
const DEFAULT_DEPOSIT_AMOUNT = process.env.NEXT_PUBLIC_DEPOSIT_DEFAULT_AMOUNT
    ? parseFloat(process.env.NEXT_PUBLIC_DEPOSIT_DEFAULT_AMOUNT)
    : 1000; // Default to 1000 if not set or invalid

if (isNaN(DEFAULT_DEPOSIT_AMOUNT) || DEFAULT_DEPOSIT_AMOUNT <= 0) {
    console.error("Error: NEXT_PUBLIC_DEPOSIT_DEFAULT_AMOUNT is not a valid positive number. Using fallback 1000.");
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.MAINNET_RPC_URL // Make sure to set this environment variable
    : process.env.ALCHEMY_SEPOLIA_URL // Use env var or fallback

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set!");
}

const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL),
}) : null;

// POST /api/investor/wallet/deposit - DEPRECATED for automatic finalization
// NOTE: This endpoint is NO LONGER CALLED automatically by the frontend after confirmation.
// The background verification service (/api/investor/wallet/verify-transactions)
// is now responsible for finding pending transactions (created by submit-pending-deposit)
// and updating their status based on blockchain state.
// This code is kept for reference or potential manual triggering but should not interfere
// with the primary asynchronous verification flow.
export async function POST(request) {
    console.warn("WARNING: /api/investor/wallet/deposit POST endpoint was called. This is generally deprecated in favor of background verification.");

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

    const { amount, currency, txHash, networkId } = body;
    const userId = session.user.id;

    // Log activity for deposit request
    try {
        await logActivity(
            userId,
            'DEPOSIT_REQUESTED',
            `Requested deposit of ${amount} ${currency}. TxHash: ${txHash}`
        );
    } catch (logError) {
        console.error("Error logging deposit request activity:", logError);
        // Decide if this error should affect the main response.
        // For now, we'll just log it.
    }

    // --- Basic Input Validation ---
    if (!amount || typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
        return NextResponse.json({ message: 'Invalid or missing amount' }, { status: 400 });
    }
    if (!currency || typeof currency !== 'string') {
        return NextResponse.json({ message: 'Invalid or missing currency' }, { status: 400 });
    }
    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
        return NextResponse.json({ message: 'Invalid or missing transaction hash (txHash)' }, { status: 400 });
    }
     // Ensure networkId is treated as a string for consistency if needed, or keep as number
    const networkIdStr = String(networkId); // Convert to string if needed downstream
    if (networkId == null) {
        return NextResponse.json({ message: 'Invalid or missing network ID' }, { status: 400 });
    }
    // --- End Basic Input Validation ---


    // <<<< LOGIC COMMENTED OUT TO PREVENT CONFLICTS WITH BACKGROUND VERIFICATION >>>>
    /*
    // --- Security Check: Prevent processing already finalized transactions ---
    try {
        const existingFinalTransaction = await Transaction.findOne({
            txHash: txHash,
            status: { $in: ['completed', 'failed', 'cancelled'] }
        });
        if (existingFinalTransaction) {
            console.warn(`Attempt to process already finalized txHash: ${txHash} by user ${userId}. Status: ${existingFinalTransaction.status}`);
            return NextResponse.json({
                message: `Transaction has already been finalized with status: ${existingFinalTransaction.status}`,
                transaction: existingFinalTransaction
            }, { status: 409 }); // Conflict
        }
    } catch (dbError) {
         console.error("Database error checking existing final transaction:", dbError);
         return NextResponse.json({ message: 'Database error checking transaction status', error: dbError.message }, { status: 500 });
    }
    // --- End Security Check ---


    // --- Blockchain Verification ---
    if (!publicClient) {
        console.error("Blockchain client not initialized. Check RPC_URL.");
        return NextResponse.json({ message: 'Internal Server Error: Cannot verify transaction' }, { status: 500 });
    }

    let receipt;
    let transactionDetails;
    try {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (!receipt) {
            console.warn(`Receipt not found for txHash: ${txHash} during final confirmation.`);
            return NextResponse.json({ message: 'Transaction receipt not found on chain. Verification may catch it later.' }, { status: 404 });
        }

        transactionDetails = await publicClient.getTransaction({ hash: txHash });
        if (!transactionDetails) {
            console.warn(`Transaction details not found for txHash: ${txHash} during final confirmation.`);
             return NextResponse.json({ message: 'Transaction details not found on chain.' }, { status: 404 });
        }

    } catch (rpcError) {
        console.error(`RPC Error verifying txHash ${txHash} during final confirmation:`, rpcError);
        return NextResponse.json({ message: 'Blockchain verification failed', error: rpcError.message }, { status: 500 });
    }
    // --- End Blockchain Verification ---


    // --- Perform Checks on Verified Data ---
    if (receipt.status !== 'success') {
        console.warn(`Transaction ${txHash} failed on-chain (status: ${receipt.status}). Updating pending record if exists.`);
        try {
            const failedUpdate = await Transaction.findOneAndUpdate(
                { txHash: txHash, user: userId, status: 'pending' },
                { $set: {
                    status: 'failed',
                    description: `Deposit failed on blockchain (status: ${receipt.status})`,
                    'blockchainData.blockNumber': Number(receipt.blockNumber)
                 }},
                { new: true }
            );
            if (failedUpdate) {
                 console.log(`Marked pending transaction ${failedUpdate._id} as failed.`);
            } else {
                 console.log(`No pending transaction found for failed txHash ${txHash} to mark as failed.`);
            }
        } catch (dbError) {
             console.error("DB error updating failed transaction:", dbError);
        }
        return NextResponse.json({ message: 'Blockchain transaction failed' }, { status: 400 });
    }

    if (!receipt.to || getAddress(receipt.to) !== CONTRACT_ADDRESS) {
        console.warn(`Transaction ${txHash} 'to' address mismatch. Expected ${CONTRACT_ADDRESS}, got ${receipt.to}`);
        return NextResponse.json({ message: 'Transaction sent to incorrect contract address' }, { status: 400 });
    }
    // --- End Checks ---


    // --- Update Database Record ---
    const depositorAddress = getAddress(transactionDetails.from);
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    let finalTransaction;
    let userUpdateResult = null;

    try {
        // Attempt to find and update the existing pending transaction FIRST
        const updateData = {
            status: 'completed',
            amount: amount, // Ensure amount from request is stored
            currency: currency,
            'blockchainData.blockNumber': Number(receipt.blockNumber),
            'blockchainData.fromAddress': depositorAddress,
            'blockchainData.networkId': networkIdStr, // Use consistent networkId
            description: `Deposit of ${amount} ${currency}` // Consistent description
        };

        finalTransaction = await Transaction.findOneAndUpdate(
            { txHash: txHash, user: userId, status: 'pending' }, // Find the specific pending tx for this user
            { $set: updateData },
            { new: true, session: mongoSession } // Return the updated document
        );

        if (finalTransaction) {
            console.log(`Updated existing pending transaction ${finalTransaction._id} to completed for txHash: ${txHash}`);
            
        } else {
            // If no PENDING transaction was updated, check if a COMPLETED one already exists
            console.log(`No PENDING transaction found for ${txHash}. Checking for existing COMPLETED record...`);
            const alreadyCompleted = await Transaction.findOne({ txHash: txHash, user: userId, status: 'completed' }).session(mongoSession);

            if (alreadyCompleted) {
                console.warn(`Completed transaction for ${txHash} already exists (ID: ${alreadyCompleted._id}). Using existing.`);
                finalTransaction = alreadyCompleted; // Use the one found
            } else {
                // Only if NO pending AND NO completed transaction exists, create a new one.
                console.warn(`No pending or completed transaction found for ${txHash}. Creating new completed record (fallback).`);
                const newCompletedTransaction = new Transaction({
                    user: userId,
                    type: 'deposit',
                    amount: amount,
                    currency: currency,
                    status: 'completed',
                    txHash: txHash,
                    balanceType: 'real',
                    blockchainData: {
                        networkId: networkIdStr,
                        blockNumber: Number(receipt.blockNumber),
                        fromAddress: depositorAddress,
                    },
                    description: `Deposit of ${amount} ${currency}`
                });
                finalTransaction = await newCompletedTransaction.save({ session: mongoSession });
                console.log(`Created new completed transaction ${finalTransaction._id} for txHash: ${txHash} (fallback).`);
            }
        }

        // Update User's Wallet Address if not set
        const user = await User.findById(userId).session(mongoSession);
        if (!user) {
            throw new Error("User not found during transaction.");
        }
        const updates = {};
        if (!user.walletAddress) {
            updates.$set = { walletAddress: depositorAddress };
            console.log(`Setting wallet address for user ${userId} to ${depositorAddress}`);
        } else if (getAddress(user.walletAddress) !== depositorAddress) {
            console.warn(`User ${userId} deposited from ${depositorAddress}, but already has ${user.walletAddress} saved.`);
        }

        if (Object.keys(updates).length > 0) {
            userUpdateResult = await User.findByIdAndUpdate(userId, updates, { new: true, session: mongoSession });
            if (!userUpdateResult) {
                throw new Error("Failed to update user wallet address.");
            }
        }

        await mongoSession.commitTransaction();
        console.log(`Deposit finalized successfully for user ${userId}, txHash: ${txHash}`);

        // Log activity for successful deposit (THIS PART WILL BE REMOVED)
        // try {
        //     await logActivity(
        //         userId,
        //         'DEPOSIT_CONFIRMED',
        //         `Confirmed deposit of ${amount} ${currency}. TxHash: ${txHash}`
        //     );
        // } catch (logError) {
        //     console.error("Error logging deposit activity:", logError);
        //     // Decide if this error should affect the main response.
        //     // For now, we'll just log it and let the main operation succeed.
        // }

    } catch (error) {
        await mongoSession.abortTransaction();
        console.error("Deposit Database Transaction Error:", error);
        return NextResponse.json({ message: 'Deposit recording failed during database transaction', error: error.message }, { status: 500 });
    } finally {
        mongoSession.endSession();
    }
    */
    // <<<< END OF COMMENTED OUT LOGIC >>>>


    // Return a message indicating this endpoint's deprecated status for automatic use.
    // If you need manual verification, consider a different endpoint or uncomment the logic above carefully.
    return NextResponse.json({
        message: 'This endpoint is deprecated for automatic deposit finalization. Background verification handles status updates.',
        note: 'If this call was intentional for manual processing, review the commented-out logic in the source code.'
    }, { status: 405 }); // Method Not Allowed or a custom status indicating deprecation might be suitable

}
