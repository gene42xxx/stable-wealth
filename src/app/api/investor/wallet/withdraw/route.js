import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { canWithdrawProfits, calculateWithdrawalAmount } from '@/lib/utils/withdrawal-conditions';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/utils/logActivity';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
// Contract ABI (minimal, just for getBalanceOf)
const contractABI = [
    {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getBalanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
        constant: true,

    }
];

// --- Configuration ---
// Ensure these match your withdrawal initiation setup and environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL // Make sure to set this environment variable
    : process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL // Use env var or fallback

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set!");
    // Optionally throw an error during server startup or handle appropriately
}


// Configure public client for blockchain interactions
const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN, // CURRENT: Using Sepolia for testing
    // TODO: Switch to mainnet for production: chain: mainnet,
    transport: http(RPC_URL)
    // TODO: For mainnet, use: transport: http('your-mainnet-rpc-url')
}) : null;

// Function to get USDT balance from smart contract
const balanceCache = new Map();
const BALANCE_CACHE_TTL = 30 * 1000; // 30 seconds in milliseconds

async function getContractUsdtBalance(walletAddress) {
    try {
        // Check cache first
        const cacheKey = `balance_${walletAddress}`;
        const cachedData = balanceCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < BALANCE_CACHE_TTL) {
            console.log(`Using cached balance for ${walletAddress}`);
            return cachedData.balance;
        }

        // No valid cache, fetch from contract
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

        // Ensure publicClient is initialized
        if (!publicClient) {
            console.error("Public client not initialized - missing RPC URL");
            throw new Error("Blockchain client not initialized");
        }

        const rawBalance = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "getBalanceOf",
            args: [walletAddress],
        });

        const decimals = 6; // Change to 6 for USDT on mainnet
        const formattedBalance = formatUnits(rawBalance, decimals);
        const numericBalance = Number(formattedBalance);

        // Save to cache
        balanceCache.set(cacheKey, {
            balance: numericBalance,
            timestamp: Date.now()
        });

        return numericBalance;
    } catch (error) {
        console.error('Error fetching contract balance:', error);
        // Return cached balance if available, even if expired
        const cacheKey = `balance_${walletAddress}`;
        const cachedData = balanceCache.get(cacheKey);
        if (cachedData) {
            console.warn(`Using expired cached balance for ${walletAddress} due to fetch error`);
            return cachedData.balance;
        }
        throw new Error('Failed to fetch balance from smart contract: ' + error.message);
    }
}

// POST /api/investor/wallet/withdraw - Step 1: Validate withdrawal request and calculate final amount
export async function POST(request) {
    console.log("Received withdrawal validation request..."); // Log entry
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const body = await request.json();
        // txHash and networkId are NOT expected here, only in the confirmation step
        const { amount, currency, targetAddress, reason, txHash } = body;
        const requestedAmount = Number(amount); // Ensure it's a number

        const userId = session.user.id;
        console.log(`Validation request for User ID: ${userId}, Amount: ${requestedAmount}, Currency: ${currency}, Target: ${targetAddress}`);

        if (!requestedAmount || requestedAmount <= 0 || !currency || !targetAddress) {
            console.warn("Validation failed: Invalid input data", body);
            return NextResponse.json({ message: 'Invalid withdrawal details: amount, currency, and targetAddress required' }, { status: 400 });
        }

        const user = await User.findById(userId).populate('subscriptionPlan');
        if (!user) {
            console.warn(`Validation failed: User not found for ID: ${userId}`);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
     
        if (!user.walletAddress) {
            console.warn(`Validation failed: User ${userId} has no connected wallet address`);
            return NextResponse.json({ message: 'User does not have a connected wallet address' }, { status: 400 });
        }

        // --- Perform Checks ---
        // 1. Get the real USDT balance from smart contract
        let contractBalance;
        try {
            contractBalance = await getContractUsdtBalance(user.walletAddress);
            console.log(`User ${userId} contract balance: ${contractBalance} USDT`);
        } catch (balanceError) {
            console.error(`Validation failed: Error fetching contract balance for ${user.walletAddress}`, balanceError);
            return NextResponse.json({ message: `Failed to fetch current balance: ${balanceError.message}` }, { status: 500 });
        }

        // 2. Check if requested amount exceeds contract balance
        if (contractBalance < requestedAmount) {
            console.warn(`Validation failed: Insufficient balance for User ${userId}. Requested: ${requestedAmount}, Available: ${contractBalance}`);
            return NextResponse.json({
                message: `Insufficient balance. You have ${contractBalance.toFixed(2)} USDT available.`,
                currentBalance: contractBalance,
                requestedAmount: requestedAmount
            }, { status: 400 });
        }

        // 3. Check withdrawal conditions (e.g., min weeks, continuity deposit)
        const withdrawalStatus = canWithdrawProfits(contractBalance, user, user.subscriptionPlan); // Pass contractBalance if needed by the function
        if (!withdrawalStatus.canWithdraw) {
            console.warn(`Validation failed: Withdrawal conditions not met for User ${userId}. Reason: ${withdrawalStatus.reason}`);
            return NextResponse.json({ message: `Withdrawal not allowed: ${withdrawalStatus.reason}` }, { status: 400 });
        }

        // 4. Calculate final amount after potential penalties
        const withdrawalCalculation = calculateWithdrawalAmount(user,contractBalance, user.subscriptionPlan, requestedAmount);
        const finalWithdrawalAmount = withdrawalCalculation.amount;
        const penaltyAmount = withdrawalCalculation.penaltyAmount;
        const penaltyPercentage = withdrawalCalculation.penaltyPercentage;
        console.log(`User ${userId} - Requested: ${requestedAmount}, Penalty: ${penaltyAmount} (${penaltyPercentage}%), Final Amount: ${finalWithdrawalAmount}`);

        if (finalWithdrawalAmount <= 0) {
            console.warn(`Validation failed: Final withdrawal amount is zero or less for User ${userId}`);
            return NextResponse.json({ message: `Withdrawal amount after penalty (${penaltyPercentage}%) is zero or less.` }, { status: 400 });
        }

        // --- Create Pending Transaction Record ---
        const withdrawalTransaction = new Transaction({
            user: userId,
            type: 'withdrawal',
            amount: -requestedAmount, // Store original requested amount as negative
            currency: currency,
            txHash: txHash,
            status: 'pending_signature', // NEW status: waiting for user's blockchain confirmation
            balanceType: 'real', // Based on contract balance check
            description: `Withdrawal request for ${requestedAmount} ${currency} to ${targetAddress}. Penalty: ${(penaltyAmount ?? 0).toFixed(2)} (${penaltyPercentage ?? 0}%). Final: ${(finalWithdrawalAmount ?? 0).toFixed(2)}. Reason: ${reason || 'N/A'}`, // Added ?? 0 safety
            metadata: {
                submittedAt: new Date(),
                targetAddress: targetAddress,
                requestedAmount: requestedAmount,
                penaltyPercentage: penaltyPercentage,
                penaltyAmount: penaltyAmount,
                finalAmount: finalWithdrawalAmount, // Amount to actually send via blockchain
                currentContractBalance: contractBalance, // Store balance at time of request
                reason: reason || 'User withdrawal'
            }
        });

        // Use MongoDB transaction for atomicity
        const mongoSession = await mongoose.startSession();
        let savedTransaction;
        try {
            await mongoSession.withTransaction(async () => {
                savedTransaction = await withdrawalTransaction.save({ session: mongoSession });
                // NOTE: lastBalanceCheck should NOT be updated here. It's handled by updateFakeProfits.
                console.log(`Pending withdrawal transaction created successfully for User ${userId}: ${savedTransaction._id}`);
            });
        } catch (error) {
            console.error("Withdrawal DB Transaction Error:", error);
            // No need to manually abort, withTransaction handles it
            return NextResponse.json({ message: 'Withdrawal request failed during database operation', error: error.message }, { status: 500 });
        } finally {
            await mongoSession.endSession();
        }

        if (!savedTransaction) {
             console.error("Failed to save transaction after session commit for User:", userId);
             return NextResponse.json({ message: 'Withdrawal request failed after database operation' }, { status: 500 });
        }

        // --- Respond to Frontend ---
        console.log(`Validation successful for User ${userId}. Responding with final amount and pending transaction.`);

        // Log activity for successful withdrawal request
        try {
            await logActivity(
                userId,
                'WITHDRAWAL_REQUESTED',
                `Requested withdrawal of ${requestedAmount} ${currency} to ${targetAddress}. Final amount: ${finalWithdrawalAmount}. TxID: ${savedTransaction._id}`
            );
        } catch (logError) {
            console.error("Error logging withdrawal request activity:", logError);
            // Decide if this error should affect the main response.
            // For now, we'll just log it and let the main operation succeed.
        }

        return NextResponse.json({
            success: true,
            message: 'Withdrawal request validated. Please confirm the transaction.',
            transaction: savedTransaction, // Send the full pending transaction object back
            finalWithdrawalAmount: finalWithdrawalAmount // Send the calculated final amount
        }, { status: 200 }); // Use 200 OK for successful validation

    } catch (error) {
        console.error("API Error validating withdrawal:", error);
        return NextResponse.json({ message: 'Error validating withdrawal request', error: error.message }, { status: 500 });
    }
}
