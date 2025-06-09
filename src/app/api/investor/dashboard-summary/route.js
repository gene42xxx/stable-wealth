import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Needed to populate
import Activity from '@/models/Activity'; // Import Activity model
// Import calculateTimeToNextThreshold along with other continuity utils
import { calculateRequiredBalance, isBotActive, calculateTimeToNextThreshold } from '@/lib/utils/continuity-deposit';
// Import updateFakeProfits and calculateProfitProjection
import { calculateDailyProfit, updateFakeProfits, calculateProfitProjection } from '@/lib/utils/profit-calculation';
import moment from 'moment';
import { createPublicClient, http, getAddress, isAddress, formatUnits } from 'viem'; // Import viem utils
import { sepolia, mainnet } from 'viem/chains'; // Import chains

// --- Viem/Contract Configuration ---
const contractABI = [ // Minimal ABI for getBalanceOf
    {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getBalanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
        constant: true,
    },
    
];
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ""; // Your contract address
const USDT_DECIMALS = 6; // Standard USDT decimals

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.MAINNET_RPC_URL
    : process.env.ALCHEMY_SEPOLIA_URL;

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set for dashboard summary!");
}

const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL),
}) : null;

// Helper function to get live balance
// Function to get USDT balance from smart contract
const balanceCache = new Map();
const BALANCE_CACHE_TTL = 60 * 1000; // Increase cache TTL to 60 seconds
const BALANCE_FETCH_TIMEOUT = 10 * 1000; // 10 seconds timeout for the RPC call

async function getContractUsdtBalance(walletAddress) {
    const cacheKey = `balance_${walletAddress}`;
    const cachedData = balanceCache.get(cacheKey);

    // Check cache first
    if (cachedData && Date.now() - cachedData.timestamp < BALANCE_CACHE_TTL) {
        console.log(`Using fresh cached balance for ${walletAddress}`);
        return cachedData.balance;
    }

    // Ensure publicClient is initialized
    if (!publicClient) {
        console.error("Public client not initialized - missing RPC URL");
        // Attempt to return stale cache if available, otherwise indicate error
        if (cachedData) {
            console.warn(`Using stale cached balance for ${walletAddress} due to uninitialized client.`);
            return cachedData.balance;
        }
        return null; // Indicate failure to fetch and no cache
    }

    console.log(`Fetching live balance for ${walletAddress} (Cache expired or missing)`);

    try {
        // --- Add Timeout Logic ---
        const fetchPromise = publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: contractABI,
            functionName: "getBalanceOf",
            args: [walletAddress],
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('RPC request timed out')), BALANCE_FETCH_TIMEOUT)
        );

        const rawBalance = await Promise.race([fetchPromise, timeoutPromise]);
        // --- End Timeout Logic ---

        const decimals = 6; // USDT decimals
        const formattedBalance = formatUnits(rawBalance, decimals);
        const numericBalance = Number(formattedBalance);

        // Save to cache
        balanceCache.set(cacheKey, {
            balance: numericBalance,
            timestamp: Date.now()
        });
        console.log(`Successfully fetched and cached live balance for ${walletAddress}: ${numericBalance}`);
        return numericBalance;

    } catch (error) {
        console.error(`Error fetching contract balance for ${walletAddress}:`, error.message);

        // Specifically handle the timeout error we introduced or potential viem timeouts
        if (error.message.includes('timed out') || error.name === 'TimeoutError') {
            console.warn(`RPC call timed out for ${walletAddress}.`);
            // Attempt to return stale cache if available
            if (cachedData) {
                console.warn(`Using stale cached balance for ${walletAddress} due to timeout.`);
                return cachedData.balance;
            }
            console.warn(`No cached balance available for ${walletAddress} after timeout.`);
            return null; // Indicate failure to fetch and no cache
        }

        // Handle other potential errors (e.g., contract revert, network issues)
        console.error(`Non-timeout error fetching balance for ${walletAddress}: ${error}`);
        // Attempt to return stale cache for other errors too
        if (cachedData) {
            console.warn(`Using stale cached balance for ${walletAddress} due to non-timeout error.`);
            return cachedData.balance;
        }
        return null; // Indicate failure to fetch and no cache for other errors
    }
}
// --- End Configuration ---

export async function GET(request) {
    console.log("RPC URL:", process.env.MAINNET_RPC_URL)

  try {
    await connectDB(); // Connect DB early
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'user') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user with populated subscription plan *without* .lean() to allow modification and saving
    const user = await User.findById(userId).populate('subscriptionPlan').select('-password'); // Removed .lean()

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch live contract balance IF user has a valid wallet address stored
    let contractBalance = null; // Default to null to indicate potential fetch failure
    if (user.walletAddress && isAddress(user.walletAddress)) {
        contractBalance = await getContractUsdtBalance(user.walletAddress);
        if (contractBalance === null) {
            console.warn(`Failed to fetch or get cached balance for user ${userId}. Proceeding with potentially inaccurate data.`);
            // Decide on fallback: 0 or maybe use a previously stored balance if available on the user model?
            contractBalance = 0; // Fallback to 0 for calculations if fetch fails completely
        }
    } else {
        console.log(`User ${userId} has no valid wallet address stored, cannot fetch live balance.`);
        contractBalance = 0; // Treat as 0 if no address
    }

    // Initialize variables that depend on plan/start date
    let plan = null;
    let requiredBalance = 0;
    let botActive = false;
    let dailyProfit = 0;
    let nextDeadlineDate = null;
    let currentWeek = 0;
    let weeklyDepositsStatus = [];
    let subscriptionPlanName = null;
    let subscriptionStartDate = null;
    let projectedProfit = 0; // Initialize projection
    let recentActivities = []; // Initialize recent activities
    let timeToNextThresholdMs = null; // Initialize threshold time

    // Only calculate subscription-related metrics if plan and start date exist
    if (user.subscriptionPlan && user.subscriptionStartDate) {
        // Ensure the plan object is fully available before using its nested properties
        // Note: Since user is not lean, user.subscriptionPlan is a Mongoose document
        const rawPlan = user.subscriptionPlan; // This is the Mongoose document or null

        // Create a plain JS object for the plan to pass to utility functions
        // and ensure nested ObjectIds are handled if necessary (though serialization might not be strictly needed if functions handle Mongoose docs)
        plan = rawPlan ? {
            _id: rawPlan._id.toString(),
            name: rawPlan.name,
            profitRateDaily: rawPlan.profitRateDaily,
            weeklyRequiredAmount: rawPlan.weeklyRequiredAmount,
            withdrawalConditions: rawPlan.withdrawalConditions ? {
                minWeeks: rawPlan.withdrawalConditions.minWeeks,
                penalties: rawPlan.withdrawalConditions.penalties?.map(p => ({
                    weeksEarly: p.weeksEarly,
                    percentage: p.percentage,
                    _id: p._id?.toString() // Optional chaining for safety
                 })) || [] // Handle case where penalties might be undefined/null
            } : undefined, // Handle case where withdrawalConditions might be undefined/null
            bonusRateThresholds: rawPlan.bonusRateThresholds?.map(t => ({
                threshold: t.threshold,
                rate: t.rate,
                _id: t._id?.toString() // Optional chaining for safety
            })) || [] // Handle case where bonusRateThresholds might be undefined/null
            // Add other necessary plan fields here
        } : null; // Handle case where there is no plan

        subscriptionPlanName = plan ? plan.name : null;
        subscriptionStartDate = user.subscriptionStartDate; // Already a Date object

        // --- Update Fake Profits BEFORE calculating dependent metrics ---
        // Pass the Mongoose user object, the plain plan object, and live balance
        // updateFakeProfits modifies the user object in place
        updateFakeProfits(user, plan, contractBalance);
        // Save the changes made by updateFakeProfits (fakeProfits, lastBalanceCheck)
        await user.save();
        console.log(`User ${userId} fake profits updated and saved.`);
        // --- End Profit Update ---


        // Calculate key metrics using utility functions, passing the live contractBalance and the plain plan object
        requiredBalance = calculateRequiredBalance(plan, subscriptionStartDate);
        botActive = isBotActive(contractBalance, plan, subscriptionStartDate);
        // Pass live balance and the *updated* user object to calculateDailyProfit
        dailyProfit = calculateDailyProfit(user, plan, contractBalance);

        // --- Calculate Profit Projection ---
        const projectionDays = 30;
        projectedProfit = calculateProfitProjection(plan, contractBalance, projectionDays);
        console.log(`Calculated ${projectionDays}-day profit projection: ${projectedProfit} based on balance ${contractBalance}`);
        // --- End Profit Projection ---

        // --- Calculate Time to Next Threshold ---
        // Ensure we have the necessary data (user, plan, contractBalance)
        if (user && plan && typeof contractBalance === 'number') {
            timeToNextThresholdMs = calculateTimeToNextThreshold(user, plan, contractBalance);
            console.log(`Calculated timeToNextThresholdMs: ${timeToNextThresholdMs}`);
        } else {
            console.log(`Skipping timeToNextThreshold calculation due to missing data (user, plan, or balance).`);
        }
        // --- End Time to Next Threshold ---


        // Calculate current week and next deadline using the Date object from the user document
        const startDateMoment = moment(user.subscriptionStartDate);
        const nowMoment = moment();
        const diffDays = nowMoment.diff(startDateMoment, 'days');
        currentWeek = Math.floor(diffDays / 7) + 1; // 1-based week number
        // Important: Clone startDateMoment before adding duration to avoid modifying the original
        nextDeadlineDate = startDateMoment.clone().add(currentWeek * 7, 'days');

        // Format weekly deposit status using the plain plan object
        const totalWeeks = 30 //plan?.withdrawalConditions?.minWeeks || 0; // Use plain plan data
        // user.weeklyDeposits is an array on the Mongoose document
        const userWeeklyDepositsMap = new Map(user.weeklyDeposits.map(d => [d.week, d]));

        console.log(`User ${userId} has ${totalWeeks} total weeks of deposits to check.`);

        for (let i = 1; i <= totalWeeks; i++) {
            const depositRecord = userWeeklyDepositsMap.get(i);
            // --- Corrected Logic ---
            // Check the 'completed' field directly from the deposit record, if it exists.
            // Default to false if no record exists for the week or if the record doesn't have 'completed: true'.
            const completed = depositRecord ? depositRecord.completed === true : false;
            // --- End Corrected Logic ---
            weeklyDepositsStatus.push({ week: i, completed: completed }); // Push the determined boolean status
        }
        console.log('Calculated weeklyDepositsStatus:', weeklyDepositsStatus); // Add log to verify output
    } else {
      console.log(`User ${userId} has no active subscription or start date. Skipping subscription calculations.`);
    }

    // --- Fetch Recent Activities (regardless of subscription status) ---
    try {
        recentActivities = await Activity.find({ user: userId })
            .sort({ createdAt: -1 }) // Get the latest first
            .limit(5) // Limit to 5 activities
            .populate('user', 'name email') // Populate user name
            .populate('targetUser', 'name') // Populate target user name if exists
            .lean(); // Use lean for performance as we don't need Mongoose methods here

        // Convert ObjectIds to strings for serialization
        recentActivities = recentActivities.map(activity => ({
            ...activity,
            _id: activity._id.toString(),
            user: activity.user ? { ...activity.user, _id: activity.user._id.toString() } : null,
            targetUser: activity.targetUser ? { ...activity.targetUser, _id: activity.targetUser._id.toString() } : null,
            createdAt: activity.createdAt.toISOString(), // Ensure date is string
            updatedAt: activity.updatedAt.toISOString(), // Ensure date is string
        }));
        console.log(`Fetched ${recentActivities.length} recent activities for user ${userId}`);
    } catch (activityError) {
        console.error(`Error fetching recent activities for user ${userId}:`, activityError);
        // Don't fail the whole request, just return empty activities
        recentActivities = [];
    }
    // --- End Fetch Recent Activities ---


    // Construct the response object, ensuring all values are serializable
    const summaryData = {
      userId: user._id.toString(), // Convert ObjectId to string
      email: user.email,
      liveContractBalance: contractBalance, // Include the live balance
      fakeProfits: user.fakeProfits, // Use the potentially updated value
      currentDailyProfit: dailyProfit, // Use the potentially updated value
      botStatus: botActive ? 'active' : 'paused',
      weeklyRequirement: plan ? (plan.weeklyRequiredAmount || 0) * currentWeek : 0,
      nextDepositDate: nextDeadlineDate ? nextDeadlineDate.toISOString() : null,
      currentWeek: currentWeek,
      weeklyDepositsCompleted: weeklyDepositsStatus,
      subscriptionPlanName: plan ? plan.name : null, // Use plain plan name
      subscriptionStartDate: user.subscriptionStartDate ? user.subscriptionStartDate.toISOString() : null,
      projectedProfit30Days: projectedProfit, // Add projected profit to response
      recentActivities: recentActivities, // Add recent activities to response
      timeToNextThreshold: timeToNextThresholdMs, // Add threshold time to response
    };

    // console.log(`Investor dashboard summary fetched successfully for user ${userId}:`, JSON.stringify(summaryData, null, 2)); // Pretty print log (can be verbose)
    console.log(`Investor dashboard summary fetched successfully for user ${userId}. Balance included: ${contractBalance}`);

    return NextResponse.json(summaryData, { status: 200 });

  } catch (error) {
    console.error('Error fetching investor dashboard summary:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
