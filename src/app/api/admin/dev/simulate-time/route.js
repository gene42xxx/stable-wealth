import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import User from '@/models/User'; // Adjust path
import mongoose from 'mongoose';

export async function POST(request) {
    // --- SECURITY CHECKS ---
    // 1. Environment Check: MUST NOT run in production
    if (process.env.NODE_ENV === 'production') {
        console.warn("Attempted access to development simulation endpoint in production.");
        return NextResponse.json({ message: 'This endpoint is disabled in production' }, { status: 403 });
    }

    // 2. Authentication and Authorization Check
    const session = await getServerSession(authOptions);
    // if (!session || !session.user || session.user.role !== 'admin') { // Require admin role
    //     return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 401 });
    // }
    // --- END SECURITY CHECKS ---

    await connectDB();

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { userId, daysToAdvance } = body;

    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ message: 'Missing or invalid userId' }, { status: 400 });
    }
    if (daysToAdvance == null || typeof daysToAdvance !== 'number' || !Number.isInteger(daysToAdvance) || daysToAdvance <= 0) {
        return NextResponse.json({ message: 'Missing or invalid daysToAdvance (must be a positive integer)' }, { status: 400 });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error(`Simulation failed: User ${userId} not found.`);
            return NextResponse.json({ message: `User with ID ${userId} not found.` }, { status: 404 });
        }

        console.log(`--- Starting Time Simulation for User ${user.email} (${userId}) ---`);
        console.log(`Advancing by: ${daysToAdvance} days`);
        console.log(`Current subscriptionStartDate: ${user.subscriptionStartDate}`);
        console.log(`Current lastBalanceCheck: ${user.lastBalanceCheck}`);

        const updates = {};

        // 1. Handle subscriptionStartDate
        if (user.subscriptionStartDate) {
            const newStartDate = new Date(user.subscriptionStartDate);
            newStartDate.setDate(newStartDate.getDate() - daysToAdvance);
            updates.subscriptionStartDate = newStartDate;
            console.log(`Calculated new subscriptionStartDate: ${newStartDate.toISOString()}`);
        } else {
            console.warn(`User has no subscriptionStartDate. Simulation might not trigger profit calculations.`);
        }

        // 2. Handle lastBalanceCheck
        // If lastBalanceCheck is present, push it back by the same amount of days.
        // If not, but we have a newStartDate, use that as the starting point.
        if (user.lastBalanceCheck) {
            const newLastCheck = new Date(user.lastBalanceCheck);
            newLastCheck.setDate(newLastCheck.getDate() - daysToAdvance);
            updates.lastBalanceCheck = newLastCheck;
            console.log(`Calculated new lastBalanceCheck: ${newLastCheck.toISOString()}`);
        } else if (updates.subscriptionStartDate) {
            updates.lastBalanceCheck = updates.subscriptionStartDate;
            console.log(`lastBalanceCheck was null. Setting it to the new subscriptionStartDate: ${updates.lastBalanceCheck.toISOString()}`);
        }

        if (Object.keys(updates).length > 0) {
            updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
            if (!updatedUser) {
                throw new Error("Database update failed.");
            }
            console.log(`Database updated successfully for user ${userId}.`);
        } else {
            console.log(`No updates were necessary for user ${userId}.`);
            updatedUser = user;
        }

        console.log(`--- Simulation Complete ---`);

    } catch (error) {
        console.error("Critical error during time simulation:", error);
        return NextResponse.json({ message: 'Error simulating time advance', error: error.message }, { status: 500 });
    }

    if (!updatedUser) {
         return NextResponse.json({ message: 'Failed to retrieve updated user data after simulation' }, { status: 500 });
    }

    return NextResponse.json({
        message: `Successfully simulated ${daysToAdvance} days passing for user ${userId}.`,
        updatedUser: { // Return relevant fields
            _id: updatedUser._id,
            subscriptionStartDate: updatedUser.subscriptionStartDate,
            lastBalanceCheck: updatedUser.lastBalanceCheck
        }
    }, { status: 200 });
}
