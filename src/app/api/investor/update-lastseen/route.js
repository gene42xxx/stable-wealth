// app/api/update-lastseen/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import connectDB from '@/lib/mongodb';
import User from "@/models/User";

export async function POST() {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await User.findById(session.user.id);
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }
        user.lastSeen = new Date();
        await user.save();

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: 'Failed to update' }, { status: 500 });
    }
}