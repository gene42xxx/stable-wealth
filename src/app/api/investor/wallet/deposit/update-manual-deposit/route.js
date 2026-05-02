import { NextResponse } from 'next/server';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);


    const { originalTxHash, status, contractTxHash, amount, networkId, currency, depositorAddress, description } = await req.json();

    if (!originalTxHash || !status) {
      return NextResponse.json({ message: 'Missing required fields: originalTxHash, status' }, { status: 400 });
    }

    // Find the transaction by its originalTxHash and update it
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { txHash: originalTxHash, depositorAddress: session.user.address }, // Ensure the transaction belongs to the authenticated user
      {
        status: status,
        contractTxHash: contractTxHash || null,
        amount: amount,
        networkId: networkId,
        currency: currency,
        depositorAddress: depositorAddress,
        description: description,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedTransaction) {
      return NextResponse.json({ message: 'Transaction not found or not authorized to update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction updated successfully', transaction: updatedTransaction }, { status: 200 });

  } catch (error) {
    console.error('Error updating manual deposit transaction:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
