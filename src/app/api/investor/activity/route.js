import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import mongoose from 'mongoose';

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'user') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    await connectDB();

    try {
        const activities = await Activity.find({ user: userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(100) // Limit to the latest 100 activities for performance
            .lean(); // Use lean for performance, as we don't need Mongoose documents

        // Convert ObjectId to string and ensure dates are in a consistent format
        const formattedActivities = activities.map(activity => ({
            ...activity,
            _id: activity._id.toString(),
            user: activity.user.toString(),
            targetUser: activity.targetUser ? activity.targetUser.toString() : null,
            createdAt: activity.createdAt.toISOString(),
            updatedAt: activity.updatedAt.toISOString(),
        }));

        return NextResponse.json({ activities: formattedActivities }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching investor activities:", error);
        return NextResponse.json({ message: 'Error fetching activities', error: error.message }, { status: 500 });
    }
}
