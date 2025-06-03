import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import APIFeatures from '@/lib/utils/apiFeatures'; // Import APIFeatures

export async function GET(request) {
    const session = await getServerSession(authOptions);
    const loggedInUserId = session?.user?.id; // Use optional chaining for safety
    const loggedInUserRole = session?.user?.role;

    if (!session || !session.user || !['admin', 'super-admin'].includes(loggedInUserRole)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectMongoDB();

        // Base query filter
        let baseFilter = {};

        if (loggedInUserRole === 'admin') {
            // Find the admin user and get the IDs of users they created
            const adminUser = await User.findById(loggedInUserId).select('createdUsers').lean();

            if (!adminUser || !adminUser.createdUsers || adminUser.createdUsers.length === 0) {
                // If admin hasn't created any users, return empty results immediately
                return NextResponse.json({
                    total: 0,
                    page: 1,
                    limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10), // Reflect requested limit
                    results: 0,
                    transactions: [],
                }, { status: 200 });
            }
            const createdUserIds = adminUser.createdUsers;
            baseFilter = { user: { $in: createdUserIds } }; // Filter by created users
        }
        // Super-admin sees all transactions, so baseFilter remains empty {}

        // --- Apply API Features ---
        const searchParams = request.nextUrl.searchParams;

        // Define searchable fields - adjust as needed
        const searchableFields = ['txHash', 'type', 'status', 'currency', 'description'];

        // Create features for the main query (with pagination, sorting, etc.)
        const features = new APIFeatures(Transaction.find(baseFilter), searchParams)
            .filter() // Apply filters from query string (excluding special ones)
            .search(searchableFields) // Apply search term across specified fields
            .sort()
            .limitFields() // Apply field selection
            .paginate(); // Apply pagination

        // Execute the main query
        const transactions = await features.query
            .populate('user', 'name email') // Populate user details
            .lean(); // Use lean for performance if not modifying docs

        // --- Get Total Count for Pagination ---
        // Need a separate query for the total count *before* pagination/limiting fields
        // Apply the same base filter and search/filter parameters
        const countQueryFeatures = new APIFeatures(Transaction.find(baseFilter), searchParams)
            .filter()
            .search(searchableFields);

        // Get the filter conditions constructed by APIFeatures for the count query
        const finalFilterForCount = countQueryFeatures.query.getFilter();

        // Execute the count query
        const totalTransactions = await Transaction.countDocuments(finalFilterForCount);

        // --- Prepare Response ---
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '100', 10); // Use the same default as APIFeatures

        return NextResponse.json({
            total: totalTransactions,
            page,
            limit,
            results: transactions.length,
            transactions,
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching admin transactions:", error);
        return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
    }
}

// export async function POST(request) {
//     const session = await getServerSession(authOptions);
//     const loggedInUserRole = session?.user?.role;

//     if (!session || !session.user || !['admin', 'super-admin'].includes(loggedInUserRole)) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     try {
//         await connectMongoDB();
//         const body = await request.json();

//         // Validate required fields for transaction creation
//         const { user, type, amount, currency, status, txHash, description, balanceType, blockchainData } = body;

//         if (!user || !type || !amount || !balanceType) {
//             return NextResponse.json({ message: 'Missing required transaction fields: user, type, amount, balanceType' }, { status: 400 });
//         }

//         // Ensure the user exists
//         const existingUser = await User.findById(user);
//         if (!existingUser) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }

//         // For admin role, ensure the admin created the user they are creating a transaction for
//         if (loggedInUserRole === 'admin') {
//             const adminUser = await User.findById(session.user.id).select('createdUsers').lean();
//             if (!adminUser || !adminUser.createdUsers || !adminUser.createdUsers.some(createdUserId => createdUserId.equals(user))) {
//                 return NextResponse.json({ message: 'Forbidden: You can only create transactions for users you created' }, { status: 403 });
//             }
//         }

//         const newTransaction = new Transaction({
//             user,
//             type,
//             amount,
//             currency: currency || 'USDT', // Default to USDT if not provided
//             status: status || 'pending', // Default to pending if not provided
//             txHash,
//             description,
//             balanceType,
//             blockchainData: {
//                 networkId: blockchainData?.networkId,
//                 blockNumber: blockchainData?.blockNumber,
//                 confirmations: blockchainData?.confirmations,
//                 networkFee: blockchainData?.networkFee // Add networkFee here
//             },
//             metadata: body.metadata // Allow arbitrary metadata
//         });

//         await newTransaction.save();

//         return NextResponse.json({ message: 'Transaction created successfully', transaction: newTransaction }, { status: 201 });

//     } catch (error) {
//         console.error("Error creating transaction:", error);
//         return NextResponse.json({ message: 'Error creating transaction', error: error.message }, { status: 500 });
//     }
// }
