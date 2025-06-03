import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TokenApproval from '@/models/TokenApproval';
import User from '@/models/User'; // Needed to link approval to user ID
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAddress } from 'viem';

// POST /api/investor/wallet/token-approval - Saves a pending token approval record
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in or user ID missing' }, { status: 401 });
    }

    await connectDB();

    try {
        const {
            ownerAddress, // Address granting approval (should match session user's wallet)
            spenderAddress, // Contract being approved
            tokenAddress, // Token being approved
            approvedAmount, // Raw amount (string)
            approvedAmountHumanReadable, // e.g., "Unlimited" or "100.00"
            transactionHash // The hash of the approval transaction
        } = await request.json();

        // --- Validation ---
        if (!ownerAddress || !isAddress(ownerAddress)) {
            return NextResponse.json({ message: 'Invalid or missing owner address.' }, { status: 400 });
        }
        // Security check: Ensure the ownerAddress matches the logged-in user's wallet if available
        // Note: session.user.walletAddress might not always be populated depending on your auth setup.
        // Add this check if session.user.walletAddress is reliable.
        // if (session.user.walletAddress && session.user.walletAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        //     console.warn(`Security Alert: Attempt to save approval for owner ${ownerAddress} by logged-in user ${session.user.walletAddress}`);
        //     return NextResponse.json({ message: 'Owner address does not match logged-in user.' }, { status: 403 });
        // }

        if (!spenderAddress || !isAddress(spenderAddress)) {
            return NextResponse.json({ message: 'Invalid or missing spender address.' }, { status: 400 });
        }
        if (!tokenAddress || !isAddress(tokenAddress)) {
            return NextResponse.json({ message: 'Invalid or missing token address.' }, { status: 400 });
        }
        if (typeof approvedAmount !== 'string' || approvedAmount.trim() === '') {
            return NextResponse.json({ message: 'Invalid or missing approved amount (raw string).' }, { status: 400 });
        }
        if (typeof approvedAmountHumanReadable !== 'string' || approvedAmountHumanReadable.trim() === '') {
            return NextResponse.json({ message: 'Invalid or missing human-readable approved amount.' }, { status: 400 });
        }
        if (typeof transactionHash !== 'string' || !transactionHash.startsWith('0x') || transactionHash.length !== 66) {
            return NextResponse.json({ message: 'Invalid or missing transaction hash.' }, { status: 400 });
        }

        // --- Create and Save ---
        // Check if an approval with this hash already exists to prevent duplicates
        const existingApproval = await TokenApproval.findOne({ transactionHash });
        if (existingApproval) {
            console.log(`Approval record with hash ${transactionHash} already exists. ID: ${existingApproval._id}`);
            // Optionally return the existing record or just a confirmation
            return NextResponse.json({ message: 'Approval record already exists.', approval: existingApproval }, { status: 200 });
        }

        const newApproval = new TokenApproval({
            user: session.user.id, // Link to the user document
            ownerAddress: ownerAddress.toLowerCase(),
            spenderAddress: spenderAddress.toLowerCase(),
            tokenAddress: tokenAddress.toLowerCase(),
            approvedAmount: approvedAmount,
            approvedAmountHumanReadable: approvedAmountHumanReadable,
            transactionHash: transactionHash,
            status: 'pendingApproval', // Custom status to indicate it needs verification
            isActive: false // Not active until verified
            // blockNumber will be added during verification
        });

        await newApproval.save();

        console.log(`Saved pending TokenApproval record: ${newApproval._id} for user ${session.user.id}, hash: ${transactionHash}`);

        return NextResponse.json({ message: 'Pending token approval recorded successfully.', approval: newApproval }, { status: 201 });

    } catch (error) {
        console.error("API Error saving token approval:", error);
        // Check for specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error saving token approval', error: error.message }, { status: 500 });
    }
}
