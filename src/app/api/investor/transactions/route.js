import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import APIFeatures from '@/lib/utils/apiFeatures';
import User from '@/models/User';

// Helper function to clean and parse amount
function parseAmount(amount) {
    if (typeof amount === 'string') {
        // Remove commas and convert to number
        const cleaned = amount.replace(/,/g, '');
        const parsed = Number(cleaned);
        if (isNaN(parsed)) {
            throw new Error(`Invalid amount format: ${amount}`);
        }
        return parsed;
    }
    if (typeof amount === 'number') {
        return amount;
    }
    throw new Error(`Invalid amount type: ${typeof amount}`);
}

// GET /api/investor/transactions - Fetch transactions for the logged-in user with filtering, sorting, etc.
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const userId = session.user.id;
        const query = Transaction.find({ user: userId });

        // Use APIFeatures utility
        const apiFeatures = new APIFeatures(query, request.nextUrl.searchParams);
        // Apply filtering and searching first to get the correct filter object for counting
        const featuresForCount = new APIFeatures(Transaction.find({ user: userId }), request.nextUrl.searchParams);
        featuresForCount.filter().search(['type', 'status', 'description']);
        const filterForCount = featuresForCount.query.getFilter(); // Get the filter conditions including user and search/filter

        // Apply all features for the actual data query
        const featuresForData = new APIFeatures(Transaction.find({ user: userId }), request.nextUrl.searchParams);
        featuresForData.filter().sort().limitFields().paginate().search(['type', 'status', 'description']);

        // Execute queries
        const transactions = await featuresForData.query.lean();
        // Use the filter conditions derived earlier for an accurate count
        const totalCount = await Transaction.countDocuments(filterForCount);

        return NextResponse.json({
            results: transactions.length, // Add the count of results on the current page
            transactions,
            pagination: {
                total: totalCount,
                page: parseInt(request.nextUrl.searchParams.get('page') || '1', 10),
                limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
            }
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
    }
}

// POST /api/investor/transactions - Create or update a transaction for the logged-in user
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();

    try {
        const userId = session.user.id;
        const body = await request.json();

        const { dbTransactionId, txHash, status, contractTxHash, description, amount, networkId, currency, depositorAddress, type } = body;

        let transaction;
        if (dbTransactionId) {
            // Update existing transaction
            // Ensure the transaction belongs to the logged-in user
            transaction = await Transaction.findOne({ _id: dbTransactionId, user: userId });

            if (!transaction) {
                return NextResponse.json({ message: 'Transaction not found or unauthorized for update' }, { status: 404 });
            }

            const updateFields = {
                status: status,
                description: description,
                blockchainData: {
                    contractTxHash: contractTxHash,
                    networkId: networkId,
                },
                // Only update these if they are explicitly provided and not null/undefined
                ...(amount !== undefined && { amount: parseAmount(amount) }), // Parse amount here
                ...(currency !== undefined && { currency: currency }),
                ...(depositorAddress !== undefined && { depositorAddress: depositorAddress }),
                ...(type !== undefined && { type: type }),
                ...(txHash !== undefined && { txHash: txHash }),
            };

            console.log('DB Transaction ID:', dbTransactionId);
            console.log('Update Fields:', updateFields);

            transaction = await Transaction.findByIdAndUpdate(
                dbTransactionId,
                { $set: updateFields },
                { new: true, runValidators: true }
            );

            return NextResponse.json({ message: 'Transaction updated successfully', transactionId: transaction._id }, { status: 200 });

        } else {
            // Create new transaction
            if (!type || !amount || !txHash || !networkId) {
                return NextResponse.json({ message: 'Missing required fields for new transaction: type, amount, txHash, networkId' }, { status: 400 });
            }

            // Parse and validate amount
            let parsedAmount;
            try {
                parsedAmount = parseAmount(amount);
            } catch (error) {
                return NextResponse.json({ message: `Invalid amount: ${error.message}` }, { status: 400 });
            }

            // Ensure the user exists (though session implies they do)
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            const newTransaction = new Transaction({
                user: userId,
                type,
                amount: parsedAmount, // Use parsed amount
                currency: currency || 'USDT',
                status: status || 'pending',
                txHash,
                description,
                blockchainData: {
                    networkId: networkId,
                    contractTxHash: contractTxHash,
                },
                depositorAddress: depositorAddress || existingUser.walletAddress, // Use provided depositorAddress or fallback to user's wallet
            });

            await newTransaction.save();
            return NextResponse.json({ message: 'Transaction created successfully', transactionId: newTransaction._id }, { status: 201 });
        }

    } catch (error) {
        console.error("Error processing investor transaction:", error);
        return NextResponse.json({ message: 'Error processing transaction', error: error.message }, { status: 500 });
    }
}