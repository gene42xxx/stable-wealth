export const formatUSDTBalance = (balance) => {
  if (balance === null || balance === undefined) return '0.00';

  // Handle different input types
  let numericBalance;
  if (typeof balance === 'bigint') {
    // Convert BigInt to number, assuming 6 decimal places for USDT
    numericBalance = Number(balance) / (10 ** 6);
  } else if (typeof balance === 'string') {
    // If it's a string representation of a big number
    numericBalance = parseFloat(balance) / (10 ** 6);
  } else {
    // If it's already a number
    numericBalance = balance;
  }

  // Format with proper decimal places and thousand separators
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6, // USDT can have up to 6 decimal places
  }).format(numericBalance);
};