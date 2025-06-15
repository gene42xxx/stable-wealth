import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ReferralCode from '@/models/ReferralCode';
import APIFeatures from '@/lib/utils/apiFeatures'; // Import the APIFeatures class
import mongoose from 'mongoose';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, sepolia } from 'viem/chains'; // Assuming Sepolia for dev, mainnet for prod

const PRODUCTION = process.env.NODE_ENV === 'production';

// --- Viem Client (for read-only operations like getBalanceOf) ---
const publicClient = createPublicClient({
    chain: PRODUCTION ? mainnet : sepolia, // Or the appropriate chain
    transport: http(),
});

// --- Constants & Config ---
const USDT_ADDRESS = process.env.USDT_ADDRESS; // USDT Contract Address
const USDT_DECIMALS = parseInt(process.env.USDT_DECIMALS || '6', 10); // Ensure decimals is a number

// Standard ERC-20 ABI for balanceOf
const erc20BalanceOfABI = [
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Simple in-memory cache for USDT balances
const balanceCache = new Map(); // Stores { address: { value: balance, timestamp: Date.now() } }
const CACHE_TTL = 10 * 1000; // 10 seconds

// Function to get cached balance or fetch it
async function getCachedUsdtBalance(walletAddress) {
    const cached = balanceCache.get(walletAddress);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.value;
    }

    // Fetch new balance
    const walletBalance = await publicClient.readContract({
        address: USDT_ADDRESS,
        abi: erc20BalanceOfABI,
        functionName: 'balanceOf',
        args: [walletAddress],
    });
    const balance = parseFloat(formatUnits(walletBalance, USDT_DECIMALS));

    // Store in cache
    balanceCache.set(walletAddress, { value: balance, timestamp: Date.now() });

    // Schedule cache invalidation (optional, but good for memory management)
    setTimeout(() => {
        balanceCache.delete(walletAddress);
    }, CACHE_TTL);

    return balance;
}

// POST /api/users - Create new user (Super-Admin only)
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'super-admin') {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  await connectDB();

  try {
    const body = await request.json();
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    let adminReferralCodeDoc = null; // Doc for admin code
    let userReferralCodeDoc = null; // Doc for user code

    // Handle referral code logic based on role
    if (body.role === 'admin') {
      // --- Admin Role Logic ---
      if (!body.adminReferralCode) {
        return NextResponse.json({ message: 'Admin referral code is required for admin role' }, { status: 400 });
      }

      adminReferralCodeDoc = await ReferralCode.findOne({
        code: body.adminReferralCode,
        targetRole: 'admin',
      });

      if (!adminReferralCodeDoc) {
        return NextResponse.json({ message: 'Invalid, used, or expired admin referral code' }, { status: 400 });
      }
      // Don't set referredByAdmin for admin role itself

      // Clean up body
      delete body.adminReferralCode;
      delete body.userReferralCode;

    } else if (body.role === 'user') {
      // --- User Role Logic ---
       if (!body.userReferralCode) {
         return NextResponse.json({ message: 'User referral code is required for user role' }, { status: 400 });
       }

       userReferralCodeDoc = await ReferralCode.findOne({
         code: body.userReferralCode,
         targetRole: 'user',
       }).populate('createdBy', '_id'); // Populate the admin who created the code

       if (!userReferralCodeDoc || !userReferralCodeDoc.createdBy) {
         return NextResponse.json({ message: 'Invalid, used, expired, or unassociated user referral code' }, { status: 400 });
       }

       // Set the referredByAdmin field based on the code's creator
       body.referredByAdmin = userReferralCodeDoc.createdBy._id;

       // Clean up body
       delete body.adminReferralCode;
       delete body.userReferralCode;

    } else {
      // --- Other Roles (e.g., super-admin) ---
       // Ensure referral codes are not present
       delete body.adminReferralCode;
       delete body.userReferralCode;
    }

    // Create the new user with potentially added referredByAdmin (for user role)
    const newUser = new User(body);
    await newUser.save();

    // Mark the specific referral code as used AFTER user creation succeeds
    if (adminReferralCodeDoc) { // Mark admin code used
      adminReferralCodeDoc.usedBy = newUser._id;
      newUser.referredByAdmin = adminReferralCodeDoc.createdBy;
      await newUser.save();
      await adminReferralCodeDoc.save();
    } else if (userReferralCodeDoc) { // Mark user code used
        userReferralCodeDoc.usedBy = newUser._id;
        newUser.referredByAdmin = userReferralCodeDoc.createdBy;
        await newUser.save();
        await userReferralCodeDoc.save();
    }

    // Exclude password from the response
    const userResponse = newUser.toObject();
    delete userResponse.password;



    return NextResponse.json({ user: userResponse }, { status: 201 });
  } catch (error) {
    console.error("API Error creating user:", error);
    return NextResponse.json(
      { message: 'Error creating user', error: error.message },
      { status: 500 }
    );
  }
}


// GET /api/users - List all users (Admin/Super-Admin only) with filtering
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        // Convert URLSearchParams to a plain object for APIFeatures
        const queryString = Object.fromEntries(searchParams.entries());

        // --- Define Base Query based on Role ---
        let baseQuery = User.find(); // Start with the base Mongoose query
        if (session.user.role === 'admin') {
            if (!session.user.id) {
                 return NextResponse.json({ message: 'Admin user ID not found in session' }, { status: 400 });
            }
            // Apply the base filter directly to the Mongoose query
            baseQuery = baseQuery.where('referredByAdmin').equals(session.user.id);
        }

        // --- Apply APIFeatures ---
        // Note: The 'search' param needs special handling as it's not a direct filter field
        // The 'referredBy' filter also needs custom handling if it's present and user is super-admin

        // Handle referredBy filter specifically for super-admins before standard filtering
        if (session.user.role === 'super-admin' || session.user.role === 'admin' && queryString.referredBy) {
            try {
                const referredById = mongoose.Types.ObjectId.createFromHexString(queryString.referredBy);
                baseQuery = baseQuery.where('referredByAdmin').equals(referredById);
            } catch (e) {
                console.warn("Invalid ObjectId format for referredBy filter:", queryString.referredBy);
                // Make the query impossible to satisfy if the ID is invalid
                baseQuery = baseQuery.where('_id').equals(null);
            }
            // Remove it so APIFeatures doesn't try to process it
            delete queryString.referredBy;
        }

        // Initialize APIFeatures with the base query and the modified queryString
        const features = new APIFeatures(baseQuery, queryString)
            .filter() // Apply standard filters (role, status, etc.)
            .search(['name', 'email']) // Apply search using regex on name/email
            .sort() // Apply sorting (defaults to -createdAt)
            .limitFields() // Apply field limiting (defaults to -__v)
            .paginate(); // Apply pagination (defaults to page 1, limit 100)

        // --- Execute Query ---
        let usersQuery = features.query.select('-password'); // Ensure password is excluded

        // Populate createdUsers for both admin and super-admin roles
        usersQuery = usersQuery.populate('createdUsers', 'name email');

        // Populate referredByAdmin only for super-admins for additional context
        if (session.user.role === 'super-admin' || session.user.role === 'admin') {
          usersQuery = usersQuery.populate('referredByAdmin', 'name email');
        }


        const users = await usersQuery.exec();

        // --- Fetch On-Chain USDT Wallet Balance for each user ---
        const usersWithWalletBalances = await Promise.all(users.map(async (user) => {
            if (!user.walletAddress || !USDT_ADDRESS) {
                console.warn(`User ${user._id} missing wallet address or USDT_ADDRESS is not set. Cannot fetch USDT balance.`);
                return { ...user.toObject(), userWalletUsdtBalance: 0 }; // Add balance field, convert to plain object
            }

            let userWalletUsdtBalance = 0;
            try {
                userWalletUsdtBalance = await getCachedUsdtBalance(user.walletAddress);
            } catch (error) {
                console.error(`Error fetching USDT wallet balance for user ${user.walletAddress}:`, error);
                // Continue even if balance fetch fails for one user
            }

            return { ...user.toObject(), userWalletUsdtBalance }; // Convert to plain object and add balance
        }));

        // debug 
        console.log(usersWithWalletBalances);

        return NextResponse.json({ users: usersWithWalletBalances }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching users:", error);
        return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
    }
}
