// src/app/api/investor/subscription/route.js
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

export async function POST(request) {
    const session = await getServerSession(authOptions);

    // 1. Authorization: Check if user is logged in and is a regular 'user'
    if (!session || !session.user || session.user.role !== 'user') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let planId;

    try {
        const body = await request.json();
        planId = body.planId;

        // 2. Validate planId
        if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
            return NextResponse.json({ message: 'Invalid Plan ID provided' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    await connectDB();

    try {
        // 3. Fetch Data Concurrently
        // Fetch user without populating plan initially, select fields needed for checks
        const user = await User.findById(userId).select('+subscriptionPlan +walletAddress');
        const plan = await SubscriptionPlan.findById(planId).lean(); // Fetch the target plan

        // 4. Perform Eligibility Checks using Utils
        // Pass null for currentPlan as this is for initial subscription
        const eligibilityResult = checkSubscriptionEligibility(user, plan, null);
        if (!eligibilityResult.eligible) {
            // Specific check: If user already has a plan, guide them to change endpoint
            if (user?.subscriptionPlan) {
                 return NextResponse.json({ message: 'User already has an active subscription. Use the change plan feature.' }, { status: 400 });
            }
            return NextResponse.json({ message: eligibilityResult.message }, { status: eligibilityResult.status });
        }

        // 5. Perform Balance Check using Util
        const balanceResult = await checkBalanceForPlan(user, plan);
        if (!balanceResult.sufficient) {
            return NextResponse.json({
                message: balanceResult.message,
                currentBalance: balanceResult.currentBalance // Provide balance info if available
            }, { status: 400 });
        }

        // 6. Update User Subscription using Util
        updateUserSubscriptionFields(user, plan._id);

        // 7. Save User and Log Activity
        await user.save();
        await logActivity(
            userId,
            'PLAN_SUBSCRIBE',
            `Subscribed to plan: ${plan.name} (ID: ${plan._id})`
        );
        

        return NextResponse.json({ message: 'Subscription successful', planId: plan._id, startDate: user.subscriptionStartDate }, { status: 200 });

    } catch (error) {
        console.error("API Error subscribing to plan:", error);
        // Log internal error activity? Maybe not necessary if caught here.
        return NextResponse.json({ message: 'Error subscribing to plan', error: error.message }, { status: 500 });
    }
}

// GET handler (Optional: could fetch the user's current subscription details)
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'user') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    try {
        const user = await User.findById(userId)
            .select('subscriptionPlan subscriptionStartDate')
            .populate({
                path: 'subscriptionPlan',
                model: SubscriptionPlan,
                select: 'name level weeklyRequiredAmount profitRateDaily features withdrawalConditions bonusRateThresholds'
            });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!user.subscriptionPlan) {
            return NextResponse.json({ subscription: null }, { status: 200 });
        }

        // Get plain JavaScript object first
        const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));
        const planObj = userObj.subscriptionPlan;

        // Create a completely new clean object with only the data we need
        const safeSubscription = {
            _id: planObj._id.toString(),
            name: planObj.name,
            level: planObj.level,
            weeklyRequiredAmount: planObj.weeklyRequiredAmount,
            profitRateDaily: planObj.profitRateDaily,
            features: planObj.features ? [...planObj.features] : [],
            withdrawalConditions: planObj.withdrawalConditions ? {
                minWeeks: planObj.withdrawalConditions.minWeeks,
                penalties: planObj.withdrawalConditions.penalties ?
                    planObj.withdrawalConditions.penalties.map(penalty => ({
                        weekRange: {
                            min: penalty.weekRange?.min,
                            max: penalty.weekRange?.max
                        },
                        penaltyPercentage: penalty.penaltyPercentage,
                        _id: penalty._id ? penalty._id.toString() : undefined // Convert nested _id
                    })) : []
            } : {},
            bonusRateThresholds: planObj.bonusRateThresholds ?
                planObj.bonusRateThresholds.map(threshold => ({
                    threshold: threshold.threshold,
                    rate: threshold.rate,
                    _id: threshold._id ? threshold._id.toString() : undefined // Convert nested _id
                })) : []
        };

        // Ensure startDate is a string
        const startDate = userObj.subscriptionStartDate instanceof Date
            ? userObj.subscriptionStartDate.toISOString()
            : userObj.subscriptionStartDate;

        return NextResponse.json({
            subscription: safeSubscription,
            startDate: startDate
        }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching user subscription:", error);
        return NextResponse.json({ message: 'Error fetching subscription details', error: error.message }, { status: 500 });
    }
}
