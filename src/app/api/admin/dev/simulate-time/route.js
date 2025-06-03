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

    const mongoSession = await mongoose.startSession();
    let updatedUser = null;

    try {
        await mongoSession.withTransaction(async () => {
            const user = await User.findById(userId).session(mongoSession);
            if (!user) {
                throw new Error(`User with ID ${userId} not found.`);
            }

            console.log(`Simulating time advance for user ${userId} by ${daysToAdvance} days.`);
            console.log(`Original subscriptionStartDate: ${user.subscriptionStartDate}`);
            console.log(`Original lastBalanceCheck: ${user.lastBalanceCheck}`);

            const updates = {};

            // Advance subscriptionStartDate backwards
            if (user.subscriptionStartDate) {
                const newStartDate = new Date(user.subscriptionStartDate);
                newStartDate.setDate(newStartDate.getDate() - daysToAdvance);
                updates.subscriptionStartDate = newStartDate;
                console.log(`New subscriptionStartDate: ${newStartDate}`);
            } else {
                 console.log(`User ${userId} has no subscriptionStartDate to modify.`);
            }

            // Advance lastBalanceCheck backwards
            if (user.lastBalanceCheck) {
                const newLastCheck = new Date(user.lastBalanceCheck);
                newLastCheck.setDate(newLastCheck.getDate() - daysToAdvance);
                updates.lastBalanceCheck = newLastCheck;
                 console.log(`New lastBalanceCheck: ${newLastCheck}`);
            } else {
                // If lastBalanceCheck is null, and subscriptionStartDate exists,
                // set the new lastBalanceCheck relative to the *new* start date
                // to simulate the initial state correctly.
                if (updates.subscriptionStartDate) {
                    updates.lastBalanceCheck = updates.subscriptionStartDate;
                    console.log(`Setting initial lastBalanceCheck relative to new start date: ${updates.lastBalanceCheck}`);
                } else {
                    console.log(`User ${userId} has no lastBalanceCheck or subscriptionStartDate to modify.`);
                }
            }

            if (Object.keys(updates).length > 0) {
                updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, session: mongoSession });
                if (!updatedUser) {
                    throw new Error("Failed to update user during simulation.");
                }
                console.log(`Successfully updated dates for user ${userId}.`);
            } else {
                 console.log(`No dates to update for user ${userId}.`);
                 updatedUser = user; // Return the original user if no updates
            }
        });

    } catch (error) {
        // No need to abort, withTransaction handles it
        console.error("Error simulating time advance:", error);
        return NextResponse.json({ message: 'Error simulating time advance', error: error.message }, { status: 500 });
    } finally {
        await mongoSession.endSession();
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
