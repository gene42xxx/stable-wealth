import { calculateRequiredBalance, isBotActive } from './continuity-deposit.js';
import { handleWeekCompletion } from './week-completion.js'; // Import the new handler
import { formatUnits } from 'viem'; // Import formatUnits if needed for comparison

const USDT_DECIMALS = 6; // Define decimals if needed for conversion

/**
 * Calculates the potential daily profit based on the required balance and applicable bonus rates.
 * @param {object} user - The user object (must include subscriptionStartDate).
 * @param {object} plan - The subscription plan object.
 * @param {number} contractBalance - The user's live contract balance (in USDT units).
 * @returns {number} The calculated potential daily profit.
 */
export function calculateDailyProfit(user, plan, contractBalance) {
  // Check if bot should be active using the live balance
  if (!user || !plan || !user.subscriptionStartDate || !isBotActive(contractBalance, plan, user.subscriptionStartDate)) return 0;

  // Base daily profit calculation
  let dailyProfitRate = plan.profitRateDaily;

  // Check for bonus rates based on the live contract balance
  if (plan.bonusRateThresholds && plan.bonusRateThresholds.length > 0) {
    // Sort thresholds in descending order to get the highest applicable bonus
    const sortedThresholds = [...plan.bonusRateThresholds].sort((a, b) => b.threshold - a.threshold);

    // Find the highest threshold that the user's contract balance meets or exceeds
    // Assumes contractBalance is already in the correct unit (e.g., USDT)
    const applicableThreshold = sortedThresholds.find(threshold => contractBalance >= threshold.threshold);

    if (applicableThreshold) {
      console.log(`Applying bonus rate of ${applicableThreshold.rate}% for balance ${contractBalance} >= threshold ${applicableThreshold.threshold}`);
      dailyProfitRate += applicableThreshold.rate;
    } else {
      console.log(`No bonus rate applied for balance ${contractBalance}`);
    }
  }

  // Calculate daily profit based on the required balance amount for the current week
  const requiredBalance = calculateRequiredBalance(plan, user.subscriptionStartDate);
  const dailyProfit = (requiredBalance * dailyProfitRate) / 100;

  return dailyProfit;
}

/**
 * Updates the user's fake profits based on elapsed time and daily profit rate.
 * NOTE: This now implicitly uses the live contract balance via calculateDailyProfit.
 * The caller needs to ensure the user object passed here is relevant (e.g., for lastBalanceCheck).
 * @param {object} user - The user object (must include lastBalanceCheck, subscriptionStartDate, fakeProfits).
 * @param {object} plan - The subscription plan object.
 * @param {number} contractBalance - The user's live contract balance (in USDT units).
 * @returns {object} The user object with potentially updated fakeProfits, lastBalanceCheck, and weeklyDeposits.
 */
export function updateFakeProfits(user, plan, contractBalance) { // No need for async if balance is passed in
  // Check if bot should be active using the live balance
  // Pass contractBalance to isBotActive check
  if (!user || !plan || !user.subscriptionStartDate ) return user; //todo: get rid of !isBotActive for now 

  const lastCheck = user.lastBalanceCheck || user.subscriptionStartDate;
  const currentDate = new Date();
  const lastCheckDate = new Date(lastCheck); // Ensure lastCheck is a Date object

  // Calculate time difference in milliseconds
  const diffTimeMs = currentDate - lastCheckDate;

  // Check if at least 24 hours (in ms) have passed
  if (diffTimeMs < (24 * 60 * 60 * 1000)) return user;

  // Calculate full days passed
  const diffDays = Math.floor(diffTimeMs / (1000 * 60 * 60 * 24));

  // Calculate profit only if at least one full day has passed
  if (diffDays >= 1) {
    // Pass contractBalance to calculateDailyProfit as it might affect bonus rates
    const dailyProfit = calculateDailyProfit(user, plan, contractBalance);
    const totalProfit = dailyProfit * diffDays; // Use the calculated full days

    user.fakeProfits += totalProfit;

    // --- Week Completion Check ---
    const startDate = new Date(user.subscriptionStartDate);

    // Calculate the week number containing lastCheckDate (0-based index relative to start)
    const startWeekNum = Math.floor((lastCheckDate - startDate) / (1000 * 60 * 60 * 24 * 7)); // returns 0-based week number example: 0, 1, 2, etc.
    // Calculate the week number containing currentDate (0-based index relative to start)
    const endWeekNum = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 7)); 

    // Check if the week number has changed
    if (endWeekNum > startWeekNum) {
      // At least one week boundary was crossed during the update period.
      console.log(`Week boundary crossed for user ${user._id}. Start week index: ${startWeekNum}, End week index: ${endWeekNum}`);

      // Loop through the weeks that *ended* between lastCheckDate and currentDate
      for (let weekIndex = startWeekNum; weekIndex < endWeekNum; weekIndex++) {
        const completedWeekNumber = weekIndex + 1; // 1-based week number for clarity
        const weekEndDate = new Date(startDate);
        // Calculate the exact end date/time of this completed week
        weekEndDate.setDate(startDate.getDate() + completedWeekNumber * 7);

        // Check if this specific week end date falls strictly *within* the update interval (lastCheckDate < weekEndDate <= currentDate)
        // This ensures we only trigger for weeks completed *since* the last check.
        if (weekEndDate > lastCheckDate && weekEndDate <= currentDate) {
           console.log(`---> Processing completion for Week ${completedWeekNumber} ending ${weekEndDate.toISOString()} for user ${user._id}`);
           // Call the handler function
           // Pass the user object (which will be modified), plan, week number,
           // the contract balance at the time of this check, and the week end date.
           handleWeekCompletion(user, plan, completedWeekNumber, contractBalance, weekEndDate);
           // Note: handleWeekCompletion modifies the user object directly but doesn't save it.
        }
      }
    }
    // --- End Week Completion Check ---

    // Calculate the timestamp representing the end of the last full day for which profit was calculated.
    // We add diffDays (the number of full days calculated) to the lastCheckDate.
    const endOfCalculatedPeriod = new Date(lastCheckDate);
    endOfCalculatedPeriod.setDate(lastCheckDate.getDate() + diffDays);
    // Optional: Set time to the very beginning of the *next* day, or end of the calculated day, for clarity.
    // Let's set it to the start of the day *after* the last calculated day.
    endOfCalculatedPeriod.setHours(0, 0, 0, 0); // Ensures we start fresh from the next day.

    // Update lastBalanceCheck to this precise timestamp.
    user.lastBalanceCheck = endOfCalculatedPeriod;
    console.log(`Updated fakeProfits by ${totalProfit}. Set lastBalanceCheck to ${user.lastBalanceCheck.toISOString()}`);
  }

  // It's crucial that ONLY this function updates user.lastBalanceCheck to maintain calculation integrity.
  // Other functions (like deposit/withdrawal) should CALL this function if they need profits updated,
  // rather than modifying lastBalanceCheck directly.
  return user;
}

/**
 * Calculates a simple profit projection based on a hypothetical deposit amount and plan rates.
 * Assumes the hypothetical deposit amount is maintained and used as the basis for profit calculation.
 * Does NOT account for weekly required balance increases over time in this simple version.
 *
 * @param {object} plan - The subscription plan object.
 * @param {number} hypotheticalDeposit - The hypothetical deposit amount to project profits for.
 * @param {number} projectionDays - The number of days to project profits over (e.g., 30).
 * @returns {number} The estimated total profit over the projection period.
 */
export function calculateProfitProjection(plan, hypotheticalDeposit, projectionDays) {
  if (!plan || typeof hypotheticalDeposit !== 'number' || hypotheticalDeposit <= 0 || typeof projectionDays !== 'number' || projectionDays <= 0) {
    return 0;
  }

  // Determine the applicable daily profit rate based on the hypothetical deposit
  let dailyProfitRate = plan.profitRateDaily;

  // Check for bonus rates based on the hypothetical balance
  if (plan.bonusRateThresholds && plan.bonusRateThresholds.length > 0) {
    const sortedThresholds = [...plan.bonusRateThresholds].sort((a, b) => b.threshold - a.threshold);
    const applicableThreshold = sortedThresholds.find(threshold => hypotheticalDeposit >= threshold.threshold);
    if (applicableThreshold) {
      dailyProfitRate += applicableThreshold.rate;
    }
  }

  // Calculate projected daily profit based on the hypothetical deposit amount
  // NOTE: This differs from calculateDailyProfit which uses requiredBalance.
  // This assumes the profit is calculated *on* the hypothetical amount.
  const projectedDailyProfit = (hypotheticalDeposit * dailyProfitRate) / 100;

  // Calculate total projected profit
  const totalProjectedProfit = projectedDailyProfit * projectionDays;

  return totalProjectedProfit;
}
