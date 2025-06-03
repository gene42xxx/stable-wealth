import { calculateRequiredBalance } from './continuity-deposit.js';
import { logActivity } from './logActivity.js'; // Import logActivity

/**
 * Resets subscription-related fields on the user object when a plan completes.
 * Modifies the user object directly. Does NOT save the user.
 *
 * @param {object} user - The Mongoose User document (mutable).
 * @param {object} plan - The user's completed subscription plan (plain JS object).
 */
function resetUserSubscription(user, plan) {
    if (!user || !plan) {
        console.error("resetUserSubscription: Missing user or plan object.");
        return;
    }

    const planName = plan.name || 'Unknown Plan'; // Get plan name for logging

    console.log(`Resetting subscription fields for user ${user._id} after completing plan ${planName}.`);

    // Log the completion event
    logActivity(user._id, 'Subscription Plan Completed', `Plan "${planName}" completed its duration.`);

    // Reset fields
    user.subscriptionPlan = null;
    user.subscriptionStartDate = null;
    user.weeklyDeposits = [];
    user.botActive = false;
    user.lastBalanceCheck = null;



}


/**
 * Handles the logic for marking a specific week as completed or not based on balance,
 * and resets the subscription if the plan duration is reached.
 * Modifies the user.weeklyDeposits array directly. Does NOT save the user.
 *
 * @param {object} user - The Mongoose User document (mutable).
 * @param {object} plan - The user's subscription plan (plain JS object).
 * @param {number} completedWeekNumber - The 1-based week number that just ended.
 * @param {number} contractBalanceAtCheck - The user's live contract balance when the check is performed.
 * @param {Date} weekEndDate - The exact date the completed week ended.
 */
export function handleWeekCompletion(user, plan, completedWeekNumber, contractBalanceAtCheck, weekEndDate) {
    if (!user || !plan || !completedWeekNumber || contractBalanceAtCheck === undefined || contractBalanceAtCheck === null || !weekEndDate) {
        console.error("handleWeekCompletion: Missing required parameters.");
        return; // Or throw an error
    }

    // Calculate the required balance specifically for the end of the completed week
    // We need a way to calculate required balance for a *past* week.
    // Let's adapt calculateRequiredBalance or create a variant.
    // For now, assume calculateRequiredBalance can handle this if we pass the weekEndDate.
    // Calculate required balance as of the specific week end date.
    const requiredBalanceForWeek = calculateRequiredBalance(plan, user.subscriptionStartDate, weekEndDate); // Pass weekEndDate

    const isWeekCompleted = contractBalanceAtCheck >= requiredBalanceForWeek;

    console.log(`--- Handling Week ${completedWeekNumber} Completion ---`);
    console.log(`User: ${user._id}`);
    console.log(`Week End Date: ${weekEndDate.toISOString()}`);
    console.log(`Balance at Check: ${contractBalanceAtCheck}`);
    console.log(`Required Balance for Week ${completedWeekNumber}: ${requiredBalanceForWeek}`);
    console.log(`Completed Status: ${isWeekCompleted}`);
    console.log(`------------------------------------------`);


    // Find if an entry for this week already exists
    let weekEntry = user.weeklyDeposits.find(deposit => deposit.week === completedWeekNumber);

    const updateData = {
        week: completedWeekNumber,
        amount: contractBalanceAtCheck, // Record balance at the time of check
        date: new Date(), // Record when the check was performed
        completed: isWeekCompleted
    };

    if (weekEntry) {
        // Update existing entry if status changed or if it wasn't marked completed before
        if (weekEntry.completed !== isWeekCompleted || !weekEntry.completed) {
             console.log(`Updating existing weeklyDeposit entry for week ${completedWeekNumber}.`);
             Object.assign(weekEntry, updateData); // Update fields
        } else {
             console.log(`WeeklyDeposit entry for week ${completedWeekNumber} already marked as completed. No update needed.`);
        }
    } else {
        // Add new entry if it doesn't exist
        console.log(`Adding new weeklyDeposit entry for week ${completedWeekNumber}.`);
        user.weeklyDeposits.push(updateData);
    }

    // Sort the array by week number just in case
    user.weeklyDeposits.sort((a, b) => a.week - b.week);

    // Check if the completed week is the final week of the plan based on minWeeks for withdrawal
    // Ensure plan.withdrawalConditions.minWeeks exists and is a valid number greater than 0
    const planDurationWeeks = plan.withdrawalConditions?.minWeeks;
    if (planDurationWeeks && typeof planDurationWeeks === 'number' && planDurationWeeks > 0 && completedWeekNumber === planDurationWeeks) {
        console.log(`--- Final Week Check (Week ${completedWeekNumber}/${planDurationWeeks}) ---`);
        if (isWeekCompleted) {
            console.log(`Final week completed successfully. Resetting subscription for user: ${user._id}`);
            resetUserSubscription(user, plan); // Call the reset function
            console.log(`--- Subscription reset complete for user: ${user._id} ---`);
        } else {
            // Log the specific message requested when the last week is not completed due to insufficient balance
            console.error(`User ${user._id} reached the final week (${completedWeekNumber}) but has insufficient balance (${contractBalanceAtCheck} < ${requiredBalanceForWeek}). Please make your final deposit to complete the plan.`);
            // Optionally, log activity here as well if needed
            // logActivity(user._id, 'Final Week Incomplete', `Insufficient balance for final week ${completedWeekNumber}. Required: ${requiredBalanceForWeek}, Actual: ${contractBalanceAtCheck}`);
        }
    }

    // NOTE: User document is modified but NOT saved here.
    // Saving should happen in the calling context (e.g., API route or cron job) after all updates.
}
