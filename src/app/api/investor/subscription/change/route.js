// src/app/api/investor/subscription/change/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { logActivity } from '@/lib/utils/logActivity';
import {
    checkSubscriptionEligibility,
    checkBalanceForPlan,
    updateUserSubscriptionFields
} from '@/lib/utils/subscriptionUtils'; // Import the new utils
import mongoose from 'mongoose';

export async function PUT(request) {
    const session = await getServerSession(authOptions);

    // 1. Authorization
    if (!session || !session.user || session.user.role !== 'user') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get and Validate Input
    let newPlanId;
    try {
        const body = await request.json();
        newPlanId = body.newPlanId; // Expecting newPlanId in the body
        if (!newPlanId || !mongoose.Types.ObjectId.isValid(newPlanId)) {
            return NextResponse.json({ message: 'Invalid New Plan ID provided' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    await connectDB();

    try {
        // 3. Fetch Data Concurrently
        // Fetch user and populate the *current* plan details needed for eligibility check
        const user = await User.findById(userId).populate({
            path: 'subscriptionPlan',
            select: 'name weeklyRequiredAmount' // Select fields needed for eligibility check
        });
        const newPlan = await SubscriptionPlan.findById(newPlanId).lean(); // Fetch the target plan

        // 4. Perform Eligibility Checks using Utils
        const eligibilityResult = checkSubscriptionEligibility(user, newPlan, user?.subscriptionPlan);
        if (!eligibilityResult.eligible) {
            return NextResponse.json({ message: eligibilityResult.message }, { status: eligibilityResult.status });
        }
        // Ensure user actually has a current plan to change from
        if (!user.subscriptionPlan) {
             return NextResponse.json({ message: 'No active subscription found to change.' }, { status: 400 });
        }

        // 5. Perform Balance Check using Util
        const balanceResult = await checkBalanceForPlan(user, newPlan);
        if (!balanceResult.sufficient) {
            return NextResponse.json({
                message: balanceResult.message,
                currentBalance: balanceResult.currentBalance // Provide balance info if available
            }, { status: 400 });
        }

        // 6. Update User Subscription using Util
        const oldPlanName = user.subscriptionPlan.name; // Store old plan name for logging
        updateUserSubscriptionFields(user, newPlan._id);

        // Reset weekly deposit tracking for the new plan
        console.log(`Resetting weeklyDeposits for user ${userId} due to plan change.`);
        user.weeklyDeposits = [];

        // 7. Save User and Log Activity
        await user.save();
        await logActivity(
            userId,
            'PLAN_CHANGE',
            `Changed subscription from '${oldPlanName}' to '${newPlan.name}' (ID: ${newPlan._id})`
        );

        // 8. Return Success Response
        return NextResponse.json({
            message: 'Subscription plan changed successfully',
            newPlanId: newPlan._id,
            startDate: user.subscriptionStartDate // Send back the new start date
        }, { status: 200 });

    } catch (error) {
        console.error("API Error changing subscription plan:", error);
        // Add more specific error handling if needed (e.g., DB errors)
        return NextResponse.json({ message: 'Error changing subscription plan', error: error.message }, { status: 500 });
    }
}
