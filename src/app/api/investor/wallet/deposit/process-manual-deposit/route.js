import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from '@/lib/utils/logActivity';
import { ethers } from 'ethers';

// Corrected ABI for processDirectDeposit
const LUXE_ABI_PROCESS_DEPOSIT = [
    {
        "name": "processDirectDeposit",
        "type": "function",
        "inputs": [
            { "name": "user", "type": "address" },
            { "name": "amount", "type": "uint256" },
            { "name": "txHash", "type": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
];

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Chain configuration
const CHAIN_CONFIG = {
    mainnet: {
        chainId: 1,
        rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL
    },
    sepolia: {
        chainId: 11155111,
        rpcUrl: process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL
    }
};

const CURRENT_CHAIN = IS_PRODUCTION ? 'mainnet' : 'sepolia';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const USDT_DECIMALS = 6;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectMongoDB();

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { txHash, amount, userAddress, networkId } = body;

    // Validate required fields early
    if (!txHash || !amount || !userAddress || !networkId) {
        return NextResponse.json({
            message: 'Missing required fields: txHash, amount, userAddress, networkId are required'
        }, { status: 400 });
    }

    // Validate environment variables
    if (!CONTRACT_ADDRESS) {
        console.error("CONTRACT_ADDRESS environment variable is not set!");
        return NextResponse.json({ message: 'Server configuration error: Contract address missing' }, { status: 500 });
    }

    if (!ADMIN_PRIVATE_KEY) {
        console.error("ADMIN_PRIVATE_KEY environment variable is not set!");
        return NextResponse.json({ message: 'Server configuration error: Admin private key missing' }, { status: 500 });
    }

    const rpcUrl = CHAIN_CONFIG[CURRENT_CHAIN].rpcUrl;
    if (!rpcUrl) {
        console.error(`RPC_URL for ${CURRENT_CHAIN} is not set!`);
        return NextResponse.json({ message: `Server configuration error: RPC URL missing` }, { status: 500 });
    }

    try {
        // Find or create transaction record
        let transaction = await Transaction.findOne({ txHash: txHash });

        if (!transaction) {
            console.log(`Transaction with txHash ${txHash} not found, creating new record.`);
            transaction = new Transaction({
                user: session.user.id,
                type: 'deposit',
                amount: amount,
                currency: 'USDT',
                status: 'processing_on_chain',
                txHash: txHash,
                depositorAddress: userAddress,
                networkId: networkId,
                balanceType: 'real',
                description: `Direct deposit of ${amount} USDT initiated.`
            });
            await transaction.save();
        } else if (transaction.status === 'completed' || transaction.status === 'failed') {
            return NextResponse.json({
                message: `Transaction already ${transaction.status}. No action needed.`
            }, { status: 200 });
        } else {
            transaction.status = 'processing_on_chain';
            await transaction.save();
        }

        // This endpoint is now deprecated for on-chain processing.
        // The client-side (wagmi) handles the processDirectDeposit contract call.
        // This endpoint will only update the transaction status in the database.

        // Update transaction record with success (or processing_on_chain if it's just for initial record)
        // The actual 'completed' status will be set by the client after contract call confirmation.
        transaction.status = 'processing_on_chain'; // Or 'pending_contract_call'
        transaction.description = `Direct deposit initiated. Awaiting on-chain contract processing via client.`;
        await transaction.save();

        await logActivity(
            session.user.id,
            'DEPOSIT_INITIATED_CLIENT_SIDE',
            `Direct deposit initiated client-side for user ${userAddress}, amount ${amount} USDT, originalTxHash: ${txHash}. Awaiting on-chain contract processing.`
        );

        return NextResponse.json({
            message: 'Transaction processed successfully',
            transaction: {
                id: transaction._id,
                status: transaction.status,
                txHash: transaction.txHash,
                contractTxHash: transaction.blockchainData?.contractTxHash,
                amount: transaction.amount,
                currency: transaction.currency
            }
        }, { status: 200 });

    } catch (error) {
        console.error(`Error processing transaction ${txHash}:`, error);

        // Try to update transaction status if it exists
        try {
            const transaction = await Transaction.findOne({ txHash: txHash });
            if (transaction && transaction.status !== 'completed') {
                transaction.status = 'failed';
                transaction.description = `Processing error: ${error.message}`;
                await transaction.save();
            }
        } catch (updateError) {
            console.error('Failed to update transaction status:', updateError);
        }

        return NextResponse.json({
            message: 'Error processing transaction',
            error: error.message,
            txHash: txHash
        }, { status: 500 });
    }
}
