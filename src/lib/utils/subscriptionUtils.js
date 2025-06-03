import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import User from '@/models/User'; // Needed for type hints/checks if used
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Needed for type hints/checks

// --- Blockchain Configuration (Copied from withdraw route) ---
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
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL
    : process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL;

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set for subscriptionUtils!");
    // Consider how to handle this - maybe throw or have a fallback?
}

const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL)
}) : null;

const balanceCache = new Map();
const BALANCE_CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Fetches USDT balance from the smart contract for a given wallet address.
 * Includes caching mechanism.
 * @param {string} walletAddress - The user's wallet address.
 * @returns {Promise<number>} - The user's USDT balance as a number.
 * @throws {Error} - If the blockchain client is not initialized or fetching fails.
 */
export async function getContractUsdtBalance(walletAddress) {
    if (!walletAddress) {
        throw new Error("Wallet address is required to fetch balance.");
    }
    if (!publicClient) {
        console.error("Public client not initialized in subscriptionUtils - missing RPC URL?");
        throw new Error("Blockchain client not initialized");
    }

    try {
        const cacheKey = `balance_${walletAddress}`;
        const cachedData = balanceCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < BALANCE_CACHE_TTL) {
            console.log(`Using cached balance for ${walletAddress}`);
            return cachedData.balance;
        }

        const contractAddress = "0x4b84fbBa64a4a71F6E1bD678e711C9bE1627fD7F"; // Ensure this is correct
        const rawBalance = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "getBalanceOf",
            args: [walletAddress],
        });

        const decimals = 6; // USDT decimals
        const formattedBalance = formatUnits(rawBalance, decimals);
        const numericBalance = Number(formattedBalance);

        balanceCache.set(cacheKey, {
            balance: numericBalance,
            timestamp: Date.now()
        });

        return numericBalance;
    } catch (error) {
        console.error(`Error fetching contract balance for ${walletAddress}:`, error);
        const cacheKey = `balance_${walletAddress}`;
        const cachedData = balanceCache.get(cacheKey);
        if (cachedData) {
            console.warn(`Using expired cached balance for ${walletAddress} due to fetch error`);
            return cachedData.balance;
        }
        throw new Error('Failed to fetch balance from smart contract: ' + error.message);
    }
}

/**
 * Checks if a user is eligible to subscribe to or change to a new plan.
 * @param {object} user - The user object (must include walletAddress and optionally populated current subscriptionPlan).
 * @param {object} newPlan - The target subscription plan object.
 * @param {object|null} currentPlan - The user's current subscription plan object (if changing plans).
 * @returns {{eligible: boolean, message: string, status: number}} - Eligibility status and message.
 */
export function checkSubscriptionEligibility(user, newPlan, currentPlan = null) {
    if (!user) {
        return { eligible: false, message: 'User not found', status: 404 };
    }
    if (!newPlan) {
        return { eligible: false, message: 'Target subscription plan not found', status: 404 };
    }
    if (!newPlan.active) {
        return { eligible: false, message: 'Target plan is not active', status: 400 };
    }
    if (!user.walletAddress) {
        // Crucial for balance check later
        return { eligible: false, message: 'User does not have a connected wallet address, Go to deposit page to connect your wallet by making your first deposit', status: 400 };
    }

    if (currentPlan) {
        // --- Plan Change Checks ---
        if (newPlan._id.toString() === currentPlan._id.toString()) {
            return { eligible: false, message: 'Already subscribed to this plan', status: 400 };
        }
        // No Downgrade Rule
        if (newPlan.weeklyRequiredAmount < currentPlan.weeklyRequiredAmount) {
            return { eligible: false, message: 'Cannot downgrade to a plan with a lower weekly requirement', status: 400 };
        }
        // Add any other plan change specific rules here (e.g., cooldown)

    } else {
        // --- Initial Subscription Checks ---
        if (user.subscriptionPlan) {
            // This case should ideally be handled by routing logic (POST vs PUT)
            // but check here as a safeguard.
            return { eligible: false, message: 'User already has an active subscription. Use the change plan feature.', status: 400 };
        }
    }

    return { eligible: true, message: 'Eligible', status: 200 };
}

/**
 * Checks if the user's contract balance meets the plan's requirement.
 * @param {object} user - The user object (must include walletAddress).
 * @param {object} plan - The subscription plan object (must include weeklyRequiredAmount).
 * @returns {Promise<{sufficient: boolean, message: string, currentBalance: number|null}>} - Balance sufficiency status.
 */
export async function checkBalanceForPlan(user, plan) {
    if (!user || !user.walletAddress) {
        return { sufficient: false, message: 'User or wallet address missing for balance check.', currentBalance: null };
    }
    if (!plan || typeof plan.weeklyRequiredAmount !== 'number') {
        return { sufficient: false, message: 'Plan or weekly required amount missing for balance check.', currentBalance: null };
    }

    let currentBalance = null;
    try {
        currentBalance = await getContractUsdtBalance(user.walletAddress);
        if (currentBalance >= plan.weeklyRequiredAmount) {
            return { sufficient: true, message: 'Balance sufficient.', currentBalance };
        } else {
            return {
                sufficient: false,
                message: `Insufficient balance. Requires ${plan.weeklyRequiredAmount.toFixed(2)} USDT, but found ${currentBalance.toFixed(2)} USDT.`,
                currentBalance
            };
        }
    } catch (error) {
        console.error(`Balance check failed for user ${user._id}:`, error);
        return {
            sufficient: false,
            message: `Failed to verify balance: ${error.message}`,
            currentBalance // May be null or stale cached value
        };
    }
}

/**
 * Updates the necessary fields on a user object for a new subscription.
 * Does NOT save the user object.
 * @param {object} user - The Mongoose user document to update.
 * @param {mongoose.Types.ObjectId} planId - The ID of the new subscription plan.
 */
export function updateUserSubscriptionFields(user, planId) {
    if (!user || !planId) {
        console.error("Attempted to update subscription fields with invalid user or planId");
        return; // Or throw an error
    }
    user.subscriptionPlan = planId;
    user.subscriptionStartDate = new Date();
    user.lastBalanceCheck = new Date(); // Reset balance check timer
    user.fakeProfits = 0; // Reset fake profits
    user.botActive = true; 
}
