import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAddress, isAddress } from 'viem'; // Import isAddress for validation

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    try {
        const { walletAddress } = await request.json();

        // Validate the received address
        if (!walletAddress || !isAddress(walletAddress)) {
            return NextResponse.json({ message: 'Invalid wallet address provided' }, { status: 400 });
        }

        // Ensure checksummed format for consistency
        const checksummedAddress = getAddress(walletAddress);

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Update only if the address is missing or different
        // Use getAddress on the stored address too, in case it wasn't stored checksummed previously
        const storedAddress = user.walletAddress ? getAddress(user.walletAddress) : null;

        if (storedAddress !== checksummedAddress) {
            console.log(`Updating wallet address for user ${userId} from ${storedAddress || 'null'} to ${checksummedAddress}`);
            user.walletAddress = checksummedAddress;
            await user.save();
             return NextResponse.json({ message: 'Wallet address updated successfully' }, { status: 200 });
        } else {
             // No update needed, address is the same
             return NextResponse.json({ message: 'Wallet address is already up to date' }, { status: 200 });
        }

    } catch (error) {
        console.error("API Error updating wallet address:", error);
        // Check for specific errors if needed, e.g., validation errors
        if (error.name === 'ValidationError') {
             return NextResponse.json({ message: 'Validation Error', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error updating wallet address', error: error.message }, { status: 500 });
    }
}
