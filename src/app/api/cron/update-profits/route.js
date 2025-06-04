import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Needed for population
import { updateFakeProfits } from '@/lib/utils/profit-calculation';
import { createPublicClient, http, getAddress, isAddress, formatUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

// --- Security ---
// Ensure you set this environment variable in your deployment environment (e.g., Vercel)
const CRON_SECRET = process.env.CRON_SECRET;

// --- Viem/Contract Configuration (Duplicated from dashboard-summary for now) ---
const contractABI = [ // Minimal ABI for getBalanceOf
    {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getBalanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
        constant: true,
    }
];
const CONTRACT_ADDRESS = "0x4b84fbBa64a4a71F6E1bD678e711C9bE1627fD7F"; // Your contract address
const USDT_DECIMALS = 6;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.MAINNET_RPC_URL
    : process.env.ALCHEMY_SEPOLIA_URL;

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set for cron job!");
}

const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL),
}) : null;

// Balance Cache (Consider if cache is appropriate for a cron job - might want fresh data)
const balanceCache = new Map();
const BALANCE_CACHE_TTL = 10 * 1000; // 10 seconds

async function getContractUsdtBalance(walletAddress) {
  // Basic validation
  if (!walletAddress || !isAddress(walletAddress)) {
      console.warn(`Invalid wallet address provided for balance check: ${walletAddress}`);
      return 0; // Return 0 for invalid addresses
  }
  try {
    const cacheKey = `balance_${walletAddress}`;
    const cachedData = balanceCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < BALANCE_CACHE_TTL) {
      // console.log(`CRON: Using cached balance for ${walletAddress}`);
      return cachedData.balance;
    }

    if (!publicClient) {
      console.error("CRON: Public client not initialized - missing RPC URL");
      throw new Error("Blockchain client not initialized");
    }

    const rawBalance = await publicClient.readContract({
      address: CONTRACT_ADDRESS, // Use constant
      abi: contractABI,
      functionName: "getBalanceOf",
      args: [walletAddress],
    });

    const formattedBalance = formatUnits(rawBalance, USDT_DECIMALS); // Use constant
    const numericBalance = Number(formattedBalance);

    balanceCache.set(cacheKey, { balance: numericBalance, timestamp: Date.now() });
    // console.log(`CRON: Fetched fresh balance for ${walletAddress}: ${numericBalance}`);
    return numericBalance;

  } catch (error) {
    console.error(`CRON: Error fetching contract balance for ${walletAddress}:`, error.message);
    // Attempt to return cached balance on error
    const cacheKey = `balance_${walletAddress}`;
    const cachedData = balanceCache.get(cacheKey);
    if (cachedData) {
      console.warn(`CRON: Using expired cached balance for ${walletAddress} due to fetch error`);
      return cachedData.balance;
    }
    // If no cache and error, return 0 or rethrow depending on desired behavior
    return 0; // Return 0 to allow processing other users
  }
}
// --- End Configuration ---

// Helper function to introduce delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn('CRON: Unauthorized access attempt.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  console.log('CRON: Starting update profits job...');
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    await connectDB();

    // 2. Fetch Active Users
    // Find users with a subscription plan and start date
    const activeUsers = await User.find({
      subscriptionPlan: { $ne: null },
      subscriptionStartDate: { $ne: null }
    }).populate('subscriptionPlan'); // Populate the plan details

    console.log(`CRON: Found ${activeUsers.length} active users to process.`);

    // 3. Process Each User
    for (const user of activeUsers) {
      try {
        // Basic check if plan is populated correctly
        if (!user.subscriptionPlan || !user.subscriptionStartDate) {
            console.warn(`CRON: Skipping user ${user._id} due to missing plan or start date after fetch.`);
            continue;
        }

        // Fetch live balance (handle invalid address within the function)
        const contractBalance = await getContractUsdtBalance(user.walletAddress);

        // Create plain plan object (similar to dashboard summary)
        const rawPlan = user.subscriptionPlan;
        const plan = {
            _id: rawPlan._id.toString(),
            name: rawPlan.name,
            profitRateDaily: rawPlan.profitRateDaily,
            weeklyRequiredAmount: rawPlan.weeklyRequiredAmount,
            withdrawalConditions: rawPlan.withdrawalConditions ? {
                minWeeks: rawPlan.withdrawalConditions.minWeeks,
                penalties: rawPlan.withdrawalConditions.penalties?.map(p => ({
                    weeksEarly: p.weeksEarly,
                    percentage: p.percentage,
                    _id: p._id?.toString()
                 })) || []
            } : undefined,
            bonusRateThresholds: rawPlan.bonusRateThresholds?.map(t => ({
                threshold: t.threshold,
                rate: t.rate,
                _id: t._id?.toString()
            })) || []
            // Add other necessary plan fields here if needed by updateFakeProfits
        };

        // Store previous values for comparison
        const oldFakeProfits = user.fakeProfits;
        const oldLastCheck = user.lastBalanceCheck;

        // Update profits (modifies user object in place)
        updateFakeProfits(user, plan, contractBalance);

        // Save only if changes occurred
        if (user.fakeProfits !== oldFakeProfits || user.lastBalanceCheck !== oldLastCheck) {
            await user.save();
            console.log(`CRON: Updated profits for user ${user._id}. New Profit: ${user.fakeProfits}, Last Check: ${user.lastBalanceCheck}`);
            updatedCount++;
        } else {
            // console.log(`CRON: No profit update needed for user ${user._id}.`);
        }

        // Optional: Add a small delay to avoid overwhelming the RPC endpoint
        await delay(100); // Delay for 100ms between users

      } catch (userError) {
        console.error(`CRON: Error processing user ${user._id}:`, userError.message);
        errorCount++;
        errors.push({ userId: user._id.toString(), error: userError.message });
      }
    }

    console.log(`CRON: Job finished. Updated: ${updatedCount}, Errors: ${errorCount}`);
    return NextResponse.json({
        message: 'Cron job completed.',
        updatedUsers: updatedCount,
        errors: errorCount,
        errorDetails: errors // Optionally include details of errors
    }, { status: 200 });

  } catch (error) {
    console.error('CRON: Fatal error during update profits job:', error);
    return NextResponse.json({ message: 'Internal Server Error during cron job', error: error.message }, { status: 500 });
  }
}
