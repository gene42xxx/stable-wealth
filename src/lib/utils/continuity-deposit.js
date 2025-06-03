/**
 * Calculates the required cumulative deposit amount based on the plan and subscription duration up to a specific date.
 * @param {object} plan - The subscription plan object.
 * @param {Date} subscriptionStartDate - The date the subscription started.
 * @param {Date} [checkDate=new Date()] - Optional. The date to calculate the requirement up to (defaults to current date).
 * @returns {number} The calculated required balance.
 */
export function calculateRequiredBalance(plan, subscriptionStartDate, checkDate = new Date()) { // Add checkDate parameter with default
  // Return 0 if required parameters are missing
  if (!plan || !subscriptionStartDate) return 0;

  // Convert subscription start date to Date object
  const startDate = new Date(subscriptionStartDate);
  // Use checkDate (or default current date) for calculations
  const effectiveDate = checkDate instanceof Date ? checkDate : new Date(); // Ensure it's a valid Date

  // Calculate the time difference between effective date and start date
  // Ensure effectiveDate is not before startDate
  if (effectiveDate < startDate) {
      return 0; // No requirement before the start date
  }
  const diffTime = effectiveDate - startDate; // No need for Math.abs if effectiveDate >= startDate

  // Convert time difference to days (rounded up)
  // Use Math.floor to count *completed* days for week calculation consistency
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate the week number (1-based) based on completed days. Week 1 starts on day 0.
  const currentWeek = Math.floor(diffDays / 7) + 1;

  // Calculate cumulative required amount (weekly amount × number of weeks)
  // Ensure weeklyRequiredAmount exists on the plan
  const weeklyAmount = plan.weeklyRequiredAmount || 0;
  return weeklyAmount * currentWeek;
}

/**
 * Checks if the bot should be active based on the user's live contract balance vs required balance.
 * @param {number} contractBalance - The user's current balance fetched from the smart contract (in USDT units, not smallest unit).
 * @param {object} plan - The user's subscription plan.
 * @param {Date} subscriptionStartDate - The user's subscription start date.
 * @returns {boolean} True if the bot should be active, false otherwise.
 */
export function isBotActive(contractBalance, plan, subscriptionStartDate) {
  // Bot cannot be active if any required data is missing
  if (contractBalance === undefined || contractBalance === null || !plan || !subscriptionStartDate) return false;

  // Calculate the required balance based on subscription duration
  const requiredBalance = calculateRequiredBalance(plan, subscriptionStartDate);


  // Bot is active only if user has sufficient contract balance
  // Assumes contractBalance is passed in the main USDT unit (e.g., 100.00)
  return contractBalance?.toFixed(2) >= requiredBalance;
}

/**
 * Calculates the time remaining in milliseconds until the next weekly deposit threshold.
 * Returns null if the bot is inactive, subscription hasn't started, or required data is missing.
 * NOTE: This function now requires the live contractBalance to be passed to isBotActive check.
 * The caller of this function needs to fetch the contract balance first.
 * @param {object} user - The user object (must include subscriptionStartDate).
 * @param {object} plan - The subscription plan object (must include weeklyRequiredAmount).
 * @param {number} contractBalance - The user's live contract balance (in USDT units).
 * @returns {number|null} Remaining time in milliseconds, or null.
 */
export function calculateTimeToNextThreshold(user, plan, contractBalance) {
  // Basic validation and check if bot should be active using the live balance
  if (!user || !plan || !user.subscriptionStartDate || !isBotActive(contractBalance, plan, user.subscriptionStartDate)) {
    // If bot isn't active (due to insufficient balance or missing data), there's no relevant threshold countdown.
    return null;
  }

  const startDate = new Date(user.subscriptionStartDate);
  const now = new Date();

  // Calculate days elapsed since start (using floor for completed days)
  const diffTime = now - startDate; // Use direct difference
  // Calculate *completed* full days since start date
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate the current week number (1-based). Week starts on day 0.
  const currentWeek = Math.floor(diffDays / 7) + 1;

  // Calculate the exact date/time of the next threshold (end of the current week)
  const nextThresholdDate = new Date(startDate);
  nextThresholdDate.setDate(startDate.getDate() + currentWeek * 7);
  // Optional: Set threshold time (e.g., end of day). For simplicity, using the exact time 7*N days after start.
  // nextThresholdDate.setHours(23, 59, 59, 999);

  // Calculate remaining time in milliseconds
  const remainingTimeMs = nextThresholdDate - now;

  // Return remaining time in ms, or 0 if it has passed (the frontend handles display)
  return Math.max(0, remainingTimeMs);
}
