import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User'; // Assuming you might need User model
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed

// GET handler to fetch transactions (e.g., for the logged-in user)
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoDB();

    // Example: Fetch transactions for the logged-in user
    // You might want to add pagination or filtering here
    const transactions = await Transaction.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
  }
}

// POST handler to create a new transaction (e.g., deposit initiation, withdrawal request)
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoDB();
    const body = await request.json();
    const userId = session.user.id;

    // --- Basic Validation ---
    const { type, amount, txHash, currency = 'USDT', balanceType = 'real' } = body; // Default currency and balanceType

    if (!type || !amount) {
      return NextResponse.json({ message: 'Missing required fields: type and amount' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    const allowedTypes = ['deposit', 'withdrawal']; // Add other types if needed via this endpoint
    if (!allowedTypes.includes(type)) {
        return NextResponse.json({ message: `Invalid transaction type. Allowed: ${allowedTypes.join(', ')}` }, { status: 400 });
    }

    // --- Create Transaction Record ---
    // Status might be 'pending' initially, especially for withdrawals or deposits needing confirmation
    const newTransaction = new Transaction({
      user: userId,
      type: type,
      amount: amount,
      currency: currency,
      status: 'pending', // Default to pending, update later based on confirmation/processing
      txHash: txHash, // Optional transaction hash from blockchain
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} initiated`, // Basic description
      balanceType: balanceType, // Track if it affects real/fake balance
      // blockchainData: {}, // Add if needed
      // metadata: {}, // Add if needed
    });

    await newTransaction.save();

    // --- TODO: Add specific logic based on type ---
    // - If 'withdrawal': Check withdrawal conditions (using utils), check balance, queue for processing, update user balance upon completion.
    // - Log activity using logActivity utility.

    console.log(`Transaction created: Type=${type}, Amount=${amount}, User=${userId}, Status=pending`);

    return NextResponse.json({ message: `${type} initiated successfully`, transaction: newTransaction }, { status: 201 });

  } catch (error) {
    console.error(`Error creating ${body?.type || 'unknown'} transaction:`, error);
    // Handle potential Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: `Error creating ${body?.type || 'unknown'} transaction`, error: error.message }, { status: 500 });
  }
}
