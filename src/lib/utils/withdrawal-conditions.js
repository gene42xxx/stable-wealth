import { isBotActive } from './continuity-deposit.js';

export function canWithdrawProfits(contractBalance, user, plan) {
    // First, check the user's canWithdraw status
    if (user && user.canWithdraw === false) {
        return {
            canWithdraw: false,
            reason: 'Withdrawals are currently disabled for this account by an administrator.'
        };
    }

    if (user?.plan || user?.subscriptionStartDate){
        const startDate = new Date(user.subscriptionStartDate);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const completedWeeks = Math.floor(diffDays / 7);

        // Check if minimum weeks requirement is met
        if (completedWeeks < plan.withdrawalConditions.minWeeks) {
            return {
                canWithdraw: false,
                reason: `Must complete ${plan.withdrawalConditions.minWeeks} weeks (${plan.withdrawalConditions.minWeeks * 7} days) of current plan before withdrawal`,
                weeksRemaining: plan.withdrawalConditions.minWeeks - completedWeeks
            };
        }

        // Check continuity deposit requirement
        if (!isBotActive(contractBalance, user, plan) && completedWeeks < plan.withdrawalConditions.minWeeks) {
            return {
                canWithdraw: false,
                reason: 'Continuity deposit requirement not met'
            };
        }
        return {
            canWithdraw: true,
            penalty: 0
        }
        
    }

    return { canWithdraw: true, penalty: 0 };
}

export function calculateWithdrawalAmount(user, contractBalance, plan, requestedAmount) {
    const withdrawalStatus = canWithdrawProfits(user, contractBalance, plan);

    if (!withdrawalStatus.canWithdraw) {
        return { amount: 0, reason: withdrawalStatus.reason };
    }

    if(!user?.plan || !user?.subscriptionStartDate){
        // If the user does not have a plan or subscription start date, no penalties apply
        console.log("calculateWithdrawalAmount: ", requestedAmount);
        return { amount: requestedAmount, penaltyPercentage: 0, penaltyAmount: 0, originalAmount: requestedAmount };
       
    }

    // If withdrawal penalties apply
    const startDate = new Date(user.subscriptionStartDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const completedWeeks = Math.floor(diffDays / 7);

    let penaltyPercentage = 0;

    // Check if any penalties apply based on week ranges
    if (plan.withdrawalConditions.penalties && plan.withdrawalConditions.penalties.length > 0) {
        const applicablePenalty = plan.withdrawalConditions.penalties.find(
            p => completedWeeks >= p.weekRange.min &&
                (p.weekRange.max === null || completedWeeks <= p.weekRange.max)
        );

        if (applicablePenalty) {
            penaltyPercentage = applicablePenalty.penaltyPercentage;
        }
    }

    // Calculate amount after penalty
    const penaltyAmount = (requestedAmount * penaltyPercentage) / 100;
    const finalAmount = requestedAmount - penaltyAmount;

    return {
        amount: finalAmount,
        penaltyPercentage,
        penaltyAmount,
        originalAmount: requestedAmount
    };
}
