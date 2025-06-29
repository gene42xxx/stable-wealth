import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
// Removed unused authOptions import
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PayoutLog from '@/models/PayoutLog';
import APIFeatures from '@/lib/utils/apiFeatures'; // Import APIFeatures
import { ethers } from 'ethers'; // Import ethers
import { createPublicClient, http, getAddress, isAddress as viemIsAddress, formatUnits as viemFormatUnits } from 'viem'; // Keep viem imports, alias isAddress
import { sepolia, mainnet } from 'viem/chains';
import { unstable_noStore as noStore } from 'next/cache';


// --- Contract Configuration ---
// Using the more complete ABI for the POST handler
const payoutABI = [

    {
      "inputs": [
        {
          "internalType": "address",
          "name": "fromUserAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "originalRecipientAddress",
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
      "name": "transferFromUserWithFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
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
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    }
];
// ABI for GET handler (minimal - assuming 'getBalanceOf' is correct)
const getBalanceABI = [
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
        "type": "function"
    },
];
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const USDT_DECIMALS = parseInt(process.env.NEXT_PUBLIC_USDT_DECIMALS || '6', 10);

// --- Environment Variables ---
const ADMIN_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY;
const SERVER_RPC_URL = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL // Use appropriate production RPC
    : process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL; // Use Sepolia RPC for dev
const SUPER_ADMIN_FEE_PERCENT_ENV = process.env.NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT;
const SUPER_ADMIN_WALLET_ADDRESS_ENV = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS;


// --- Critical Environment Variable Checks (at module load) ---
if (!CONTRACT_ADDRESS) {
    console.error("CRITICAL: NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set!");
}
if (!SERVER_RPC_URL) {
    console.error("CRITICAL: Server RPC_URL environment variable is not set (check NEXT_PUBLIC_MAINNET_RPC_URL or NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL)!");
}
if (!ADMIN_PRIVATE_KEY) {
    console.error("CRITICAL: ADMIN_WALLET_PRIVATE_KEY environment variable is not set!");
}
if (!SUPER_ADMIN_FEE_PERCENT_ENV || isNaN(parseFloat(SUPER_ADMIN_FEE_PERCENT_ENV))) {
    console.error("CRITICAL: SUPER_ADMIN_FEE_PERCENT environment variable is not set or is not a valid number!");
}
if (!SUPER_ADMIN_WALLET_ADDRESS_ENV || !ethers.isAddress(SUPER_ADMIN_WALLET_ADDRESS_ENV) ) { // Using ethers.isAddress for validation
    console.error("CRITICAL: SUPER_ADMIN_WALLET_ADDRESS environment variable is not set or is not a valid Ethereum address!");
}


// --- Balance Fetching for GET request (using Viem) ---
const balanceCache = new Map();
const BALANCE_CACHE_TTL = 60 * 1000; // 60 seconds cache TTL
const BALANCE_FETCH_TIMEOUT = 10 * 1000; // 10 seconds timeout

async function getContractUsdtBalance(userAddress) {
    // Use viem client for GET request balance fetching
    const viemRpcUrl = process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL
        : process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL; // Separate variable for clarity

    const viemPublicClient = viemRpcUrl ? createPublicClient({
        chain: process.env.NODE_ENV === 'production' ? mainnet : sepolia,
        transport: http(viemRpcUrl),
    }) : null;

    if (!viemPublicClient || !CONTRACT_ADDRESS || !userAddress || !viemIsAddress(userAddress)) {
        console.warn(`Invalid input for getContractUsdtBalance (viem): client=${!!viemPublicClient}, contract=${!!CONTRACT_ADDRESS}, address=${userAddress}`);
        return 0;
    }

    const cacheKey = userAddress.toLowerCase();
    const cached = balanceCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < BALANCE_CACHE_TTL)) {
        return cached.balance;
    }

    try {
        const contractAddressViem = getAddress(CONTRACT_ADDRESS); // Viem's getAddress for checksum
        const userAddressViem = getAddress(userAddress);

        const balancePromise = viemPublicClient.readContract({
            address: contractAddressViem,
            abi: getBalanceABI, // Use minimal ABI here
            functionName: 'getBalanceOf', // Assuming contract uses 'getBalanceOf'
            args: [userAddressViem],
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('RPC call timed out')), BALANCE_FETCH_TIMEOUT));
        const balanceBigInt = await Promise.race([balancePromise, timeoutPromise]);
        const balanceFormatted = parseFloat(viemFormatUnits(balanceBigInt, USDT_DECIMALS));
        balanceCache.set(cacheKey, { balance: balanceFormatted, timestamp: Date.now() });
        return balanceFormatted;
    } catch (error) {
        console.error(`Error fetching contract balance (viem) for ${userAddress}:`, error.message || error);
        if (cached && (Date.now() - cached.timestamp < BALANCE_CACHE_TTL * 5)) {
            return cached.balance;
        }
        return 0;
    }
}


// --- API Handlers ---

// GET Handler - Fetch Users with Live Balance OR Payout History
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // --- Get Token and User Info ---
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.role || !['admin', 'super-admin'].includes(token.role)) {
        return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const userId = token.sub; // User ID from token
    const userRole = token.role;

    console.log(`Payout Gateway GET request by User ID: ${userId}, Role: ${userRole}, Action: ${action}`);

    noStore(); // Ensure dynamic processing after auth check

    await connectDB();

    // --- Fetch Payout History ---
    if (action === 'history') {
      try {
          const searchParams = request.nextUrl.searchParams;
          let baseQuery = {};
          if (userRole === 'admin') {
              // Admin gets payouts initiated by them
              baseQuery = { adminId: userId }; // <-- Restoring adminId filter
          }
          // Super-admin gets all payouts (empty baseQuery)

          // Define fields available for searching within PayoutLog model
          const searchableFields = ['recipientAddress', 'transactionHash', 'status', 'adminWalletAddress'];
          // Note: Searching populated fields like user/admin name directly here is complex.
          // Consider adding specific query params for user/admin ID if needed, or use aggregation.

          // --- [TEMP TEST] Bypassing APIFeatures ---
          // Log the received searchParams
          console.log("Received searchParams:", Object.fromEntries(searchParams.entries()));

          // --- Count total documents matching filters/search ---
          const countQuery = PayoutLog.find(baseQuery);
          const countFeatures = new APIFeatures(countQuery, searchParams)
              .filter()
              .search(searchableFields);
          // Log the query used for counting
          console.log("Payout History Count Query Filter:", JSON.stringify(countFeatures.query.getFilter()));
          const totalPayouts = await countFeatures.query.countDocuments();
          console.log("Total Payouts Found (before pagination):", totalPayouts);

          // --- Fetch paginated & filtered documents ---
          const features = new APIFeatures(PayoutLog.find(baseQuery), searchParams)
              .filter()
              .search(searchableFields)
              .sort() // Use default sort (-createdAt) or query param
              .paginate() // Apply skip and limit
              .limitFields(); // Apply field limiting if needed (optional)

          // Log the final query filter before execution
          console.log("Payout History Fetch Query Filter:", JSON.stringify(features.query.getFilter()));
          // Log skip and limit values
          const page = parseInt(searchParams.get('page') || '1', 10);
          const limit = parseInt(searchParams.get('limit') || '10', 10); // Use the same limit as below
          console.log(`Applying Pagination: Page ${page}, Limit ${limit}`);


          const payoutLogs = await features.query
              .populate('userId', 'name email walletAddress') // Populate user details
              .populate('adminId', 'name email') // Populate admin details
              .lean(); // Use lean for faster results

          console.log("Payout Logs Fetched (after pagination):", payoutLogs.length);


          // --- Calculate Pagination Metadata ---
          // const page = parseInt(searchParams.get('page') || '1', 10); // Already defined above
          // Use a default limit consistent with APIFeatures or a desired value
          // const limit = parseInt(searchParams.get('limit') || '10', 10); // REMOVED: Already declared above
          const totalPages = Math.ceil(totalPayouts / limit); // Use 'limit' declared earlier

          // Map results to match frontend expectations
          const transactions = payoutLogs.map(log => ({
             _id: log._id,
             timestamp: log.createdAt,
             user: {
                 name: log.userId?.name || 'N/A',
                 email: log.userId?.email || 'N/A',
             },
             userWallet: log.userId?.walletAddress || 'N/A',
             recipientAddress: log.recipientAddress,
             amount: log.amount,
             status: log.status,
             transactionHash: log.transactionHash,
             adminName: log.adminId?.email || 'N/A',
             adminWallet: log.adminWalletAddress, // Include admin wallet if needed
             type: "Payout"
             // Add other fields if needed
          }));

          // --- Return Paginated Response ---
          return NextResponse.json({
              transactions,
              pagination: {
                  total: totalPayouts,
                  page: page,
                  limit: limit,
                  totalPages: totalPages,
              }
          }, { status: 200 });

      } catch (error) {
          console.error('Error fetching payout history:', error);
          return NextResponse.json({ message: 'Internal Server Error fetching payout history' }, { status: 500 });
      }
    }

    // --- Fetch Users with Balance (Default GET behavior) --- 
    try {
        let query = { };

        // Filter by referredByAdmin if the user is an 'admin' but not 'super-admin'
        if (userRole === 'admin') {
            query.referredByAdmin = userId;
            console.log(`Admin user ${userId} fetching only their referred investors.`);
        } else {
             console.log(`Super-admin user ${userId} fetching all investors.`);
        }

        const users = await User.find(query)
            .select('name email walletAddress balance referredByAdmin') // Select fields needed by frontend + balance + referredByAdmin
            .sort({ createdAt: -1 })
            .lean();

        if (!users || users.length === 0) {
            return NextResponse.json({ users: [], message: 'No investor users found.' }, { status: 200 });
        }

        console.log(`Fetched ${users.length} investor users for payout gateway.`);

        // Fetch live contract balances in parallel with caching
        const usersWithBalances = await Promise.all(users.map(async (user) => {
            let contractBalance = 0;
            // Use viemIsAddress for the GET handler's check
            if (user.walletAddress && viemIsAddress(user.walletAddress)) {
                contractBalance = await getContractUsdtBalance(user.walletAddress);
            } else {
                console.warn(`User ${user.email} (ID: ${user._id}) has invalid or missing wallet address: ${user.walletAddress}`);
            }
            // Explicitly construct the object to ensure contractBalance is included
            const userWithBalance = {
                ...user,
                contractBalance: contractBalance || 0, // Ensure it's a number, default to 0
            };
            return userWithBalance;
        }));

        console.log(`Finished fetching balances for ${usersWithBalances.length} users.`);

        return NextResponse.json({ users: usersWithBalances });

    } catch (error) {
        console.error('Error fetching users for payout gateway:', error);
        return NextResponse.json({ message: 'Internal Server Error fetching users' }, { status: 500 });
    }
}

// POST Handler - Execute Server-Side Payout
export async function POST(request) {
    await connectDB();
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // 1. Authentication & Authorization
    if (!token || !['admin', 'super-admin'].includes(token.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    const adminUserId = token.sub; // ID of the admin performing the action

    // 2. Initialize Ethers Provider and Wallet *inside* the handler
    let provider;
    let adminWallet;
    if (SERVER_RPC_URL && ADMIN_PRIVATE_KEY && CONTRACT_ADDRESS) {
        try {
            provider = new ethers.JsonRpcProvider(SERVER_RPC_URL);
            adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
            console.log(`Admin wallet initialized for request: ${adminWallet.address}`);
        } catch (initError) {
            console.error("Payout POST failed: Ethers provider/wallet initialization error:", initError);
            return NextResponse.json({ error: 'Server configuration error (Wallet Init). Cannot process payout.' }, { status: 500 });
        }
    } else {
         console.error("Payout POST failed: Missing RPC_URL, ADMIN_WALLET_PRIVATE_KEY, or CONTRACT_ADDRESS.");
         return NextResponse.json({ error: 'Server configuration error (Missing Env Vars). Cannot process payout.' }, { status: 500 });
    }

    // Now provider and adminWallet are guaranteed to be defined if we reach here

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // If action is not 'estimateFee', proceed with actual payout logic
    let payload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { userId, recipientAddress, amount: amountString } = payload;

    // 3. Input Validation (using ethers)
    if (!userId || !recipientAddress || !amountString) {
        return NextResponse.json({ error: 'Missing required fields: userId, recipientAddress, amount' }, { status: 400 });
    }
    if (!ethers.isAddress(recipientAddress)) {
        return NextResponse.json({ error: 'Invalid recipient wallet address format.' }, { status: 400 });
    }
    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
         return NextResponse.json({ error: 'Invalid contract address configuration on server.' }, { status: 500 });
    }
    // Validate super admin config again here in case env vars changed since module load (though unlikely for prod)
    const superAdminFeePercent = parseFloat(SUPER_ADMIN_FEE_PERCENT_ENV);
    const superAdminWalletAddress = SUPER_ADMIN_WALLET_ADDRESS_ENV;
    if (isNaN(superAdminFeePercent) || superAdminFeePercent < 0 || superAdminFeePercent > 100) {
        console.error("Payout POST failed: Invalid SUPER_ADMIN_FEE_PERCENT configuration.");
        return NextResponse.json({ error: 'Server configuration error (Fee Percent). Cannot process payout.' }, { status: 500 });
    }
    if (!superAdminWalletAddress || !ethers.isAddress(superAdminWalletAddress)) {
        console.error("Payout POST failed: Invalid SUPER_ADMIN_WALLET_ADDRESS configuration.");
        return NextResponse.json({ error: 'Server configuration error (Super Admin Wallet). Cannot process payout.' }, { status: 500 });
    }


    let userToPayout;
    let userWalletAddress;
    let amountParsed;
    let amountFloat;

    try {
        // 4. Fetch User & Validate User Wallet
        userToPayout = await User.findById(userId).lean(); // Use lean for performance
        if (!userToPayout) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        userWalletAddress = userToPayout.walletAddress;
        if (!userWalletAddress || !ethers.isAddress(userWalletAddress)) { // Use ethers.isAddress
            return NextResponse.json({ error: "Selected user has an invalid or missing source wallet address." }, { status: 400 });
        }
        if (recipientAddress.toLowerCase() === userWalletAddress.toLowerCase()) {
            return NextResponse.json({ error: "Recipient address cannot be the same as the user's source address." }, { status: 400 });
        }

        // 5. Parse Amount (using ethers)
        try {
            amountParsed = ethers.parseUnits(amountString.replace(',', '.').trim(), USDT_DECIMALS); // Use ethers.parseUnits
            amountFloat = parseFloat(ethers.formatUnits(amountParsed, USDT_DECIMALS)); // Use ethers.formatUnits
            if (amountParsed <= 0n) {
                throw new Error("Amount must be positive.");
            }
        } catch (parseError) {
            console.error("Amount parsing error:", parseError);
            return NextResponse.json({ error: "Invalid amount format. Please enter a positive number (e.g., 100.50)." }, { status: 400 });
        }

        // --- Optional but Recommended: Server-Side Balance Check (using ethers) ---
        const contractReader = new ethers.Contract(CONTRACT_ADDRESS, payoutABI, provider); // Use provider for read-only
        const userBalanceBigInt = await contractReader.getBalanceOf(userWalletAddress);
        if (amountParsed > userBalanceBigInt) {
            const balanceFormatted = ethers.formatUnits(userBalanceBigInt, USDT_DECIMALS);
            const amountRequestedFormatted = ethers.formatUnits(amountParsed, USDT_DECIMALS);
            return NextResponse.json({ error: `Insufficient balance. User has ${balanceFormatted} USDT on-chain, attempted: ${amountRequestedFormatted} USDT.` }, { status: 400 });
        }
        // --- End Optional Balance Check ---

        // 5.5 Calculate Fee
        const feeAmountParsed = (amountParsed * BigInt(Math.round(superAdminFeePercent * 100))) / BigInt(10000);
        const netAmountParsed = amountParsed - feeAmountParsed;

        if (feeAmountParsed < 0n || netAmountParsed < 0n) { // Should not happen if percent is 0-100
             return NextResponse.json({ error: 'Error in fee calculation resulting in negative amount.' }, { status: 500 });
        }
        const feeAmountFloat = parseFloat(ethers.formatUnits(feeAmountParsed, USDT_DECIMALS));
        const netAmountFloat = parseFloat(ethers.formatUnits(netAmountParsed, USDT_DECIMALS));


        // 6. Log Initial Attempt
        const initialLog = new PayoutLog({
            adminId: adminUserId,
            userId: userToPayout._id,
            recipientAddress: recipientAddress, // Original recipient
            amount: amountFloat, // Total amount requested
            status: 'processing',
            transactionHash: null,
            adminWalletAddress: adminWallet.address,
            metadata: { // Store fee details
                superAdminFeePercent: superAdminFeePercent,
                superAdminWalletAddress: superAdminWalletAddress,
                feeAmount: feeAmountFloat,
                netAmountToRecipient: netAmountFloat,
                totalAmount: amountFloat
            }
        });
        await initialLog.save();
        // 6. Log Initial Attempt or Update Existing
        let payoutLogEntry;
        const recentLogThreshold = new Date(Date.now() - 5 * 60 * 1000); // Check for logs in the last 5 minutes

        // Attempt to find a recent 'processing' or 'pending' log for this user/recipient/amount
        payoutLogEntry = await PayoutLog.findOne({
            adminId: adminUserId,
            userId: userToPayout._id,
            recipientAddress: recipientAddress,
            amount: amountFloat,
            status: { $in: ['processing', 'pending'] },
            createdAt: { $gte: recentLogThreshold }
        });

        if (payoutLogEntry) {
            // If a recent log exists, update it
            console.log(`Found existing payout attempt log (ID: ${payoutLogEntry._id}), updating status to processing.`);
            payoutLogEntry.status = 'processing'; // Ensure status is processing before sending tx
            payoutLogEntry.adminWalletAddress = adminWallet.address; // Update admin wallet just in case
            payoutLogEntry.metadata = { // Ensure metadata is current
                superAdminFeePercent: superAdminFeePercent,
                superAdminWalletAddress: superAdminWalletAddress,
                feeAmount: feeAmountFloat,
                netAmountToRecipient: netAmountFloat,
                totalAmount: amountFloat
            };
            await payoutLogEntry.save();
        } else {
            // If no recent log exists, create a new one
            console.log('No recent payout attempt log found, creating a new one.');
            payoutLogEntry = new PayoutLog({
                adminId: adminUserId,
                userId: userToPayout._id,
                recipientAddress: recipientAddress, // Original recipient
                amount: amountFloat, // Total amount requested
                status: 'processing',
                transactionHash: null,
                adminWalletAddress: adminWallet.address,
                metadata: { // Store fee details
                    superAdminFeePercent: superAdminFeePercent,
                    superAdminWalletAddress: superAdminWalletAddress,
                    feeAmount: feeAmountFloat,
                    netAmountToRecipient: netAmountFloat,
                    totalAmount: amountFloat
                }
            });
            await payoutLogEntry.save();
            console.log(`New payout attempt logged (ID: ${payoutLogEntry._id}).`);
        }

        console.log(`Initiating transaction for payout log ID: ${payoutLogEntry._id}...`);

        // 7. Initialize Contract with Signer and Send Transaction
        const payoutContract = new ethers.Contract(CONTRACT_ADDRESS, payoutABI, adminWallet);

        console.log(`Preparing to execute transferFromUserWithFee:
            Contract: ${CONTRACT_ADDRESS}
            Admin Signer: ${adminWallet.address}
            User (From): ${userWalletAddress}
            Original Recipient: ${recipientAddress}
            Super Admin Wallet: ${superAdminWalletAddress}
            Total Amount (Units): ${amountParsed.toString()} (${amountFloat} USDT)
            Fee Amount (Units): ${feeAmountParsed.toString()} (${feeAmountFloat} USDT)`);

        let estimatedGasFeeEth = 'N/A';
        try {
            // Estimate gas
            const gasEstimate = await payoutContract.estimateGas.transferFromUserWithFee(
                userWalletAddress,
                recipientAddress,
                superAdminWalletAddress,
                amountParsed, // totalAmount
                feeAmountParsed  // feeAmount
            );
            console.log(`Estimated gas units: ${gasEstimate.toString()}`);

            // Get current gas price (using feeData for EIP-1559 compatibility)
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice || feeData.maxFeePerGas; // Use gasPrice or maxFeePerGas

            if (gasPrice) {
                 const estimatedFeeWei = gasEstimate * gasPrice;
                 estimatedGasFeeEth = ethers.formatEther(estimatedFeeWei);
                 console.log(`Estimated gas price: ${gasPrice.toString()} wei`);
                 console.log(`Estimated gas fee: ${estimatedFeeWei.toString()} wei (${estimatedGasFeeEth} ETH)`);
            } else {
                 console.warn("Could not get gas price from provider.");
            }

        } catch (estimateError) {
            console.error("Error estimating gas:", estimateError);
            // Continue without gas estimation if it fails
        }


        const tx = await payoutContract.transferFromUserWithFee(
            userWalletAddress,
            recipientAddress,
            superAdminWalletAddress,
            amountParsed, // totalAmount
            feeAmountParsed  // feeAmount
        );

        console.log(`Transaction submitted with hash: ${tx.hash}`);

        // 8. Update Log with Hash
        initialLog.transactionHash = tx.hash;
        initialLog.status = 'pending';
        await initialLog.save();

        // 9. Return Transaction Hash and Estimated Gas Fee
        return NextResponse.json({
            message: 'Payout transaction with fee submitted successfully.',
            transactionHash: tx.hash,
            logId: initialLog._id,
            estimatedGasFeeEth: estimatedGasFeeEth // Include estimated gas fee
        }, { status: 200 });

    } catch (error) {
        console.error('Server-side payout error:', error);

        // Extract cleaner error message if possible
        let errorMessage = 'Internal Server Error during payout execution.';
        if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Admin wallet has insufficient funds for gas.';
        } else if (error.reason) { // Ethers contract call error reason
            errorMessage = `Transaction reverted: ${error.reason}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Attempt to log the failure
        try {
            await PayoutLog.create({
                adminId: adminUserId,
                userId: userToPayout?._id || userId || null,
                recipientAddress: recipientAddress || null,
                amount: amountFloat || (!isNaN(parseFloat(amountString)) ? parseFloat(amountString) : 0), // Total amount
                status: 'failed',
                errorMessage: errorMessage,
                adminWalletAddress: adminWallet?.address || 'N/A',
                metadata: { // Log fee details even on failure if available
                    superAdminFeePercent: superAdminFeePercent || 0,
                    superAdminWalletAddress: superAdminWalletAddress || 'N/A',
                    feeAmount: feeAmountFloat || 0,
                    netAmountToRecipient: netAmountFloat || 0,
                    totalAmount: amountFloat || (!isNaN(parseFloat(amountString)) ? parseFloat(amountString) : 0)
                }
            });
        } catch (logErr) {
            console.error("Failed to log payout failure:", logErr);
        }

        // Return specific error if known, otherwise generic
        const statusCode = errorMessage.includes('Insufficient balance') || errorMessage.includes('Invalid') ? 400 : 500;
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
