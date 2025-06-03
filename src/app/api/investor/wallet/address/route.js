import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAddress, isAddress } from 'viem';

export async function GET(request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select('walletAddress'); // Select only the walletAddress field

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Validate and checksum the address before returning
    const walletAddress = user.walletAddress && isAddress(user.walletAddress)
                            ? user.walletAddress
                            : null;

    return NextResponse.json({ walletAddress }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user wallet address:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
