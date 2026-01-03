// ==========================================
// PRORATION CALCULATOR UTILITY
// ==========================================
// Handles all proration calculations for tier upgrades/downgrades
// ==========================================

/**
 * Calculate the number of days between two dates
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get the number of days in a billing cycle
 * @param {string} billingCycle - WEEKLY, MONTHLY, YEARLY
 * @returns {number} Number of days
 */
export const getDaysInCycle = (billingCycle) => {
  switch (billingCycle) {
    case "WEEKLY":
      return 7;
    case "MONTHLY":
      return 30; // Standardized to 30 days
    case "YEARLY":
      return 365;
    default:
      return 30;
  }
};

/**
 * Calculate the daily rate for a price
 * @param {number} price - Total price for the period
 * @param {string} billingCycle - WEEKLY, MONTHLY, YEARLY
 * @returns {number} Daily rate
 */
export const calculateDailyRate = (price, billingCycle) => {
  const daysInCycle = getDaysInCycle(billingCycle);
  return price / daysInCycle;
};

/**
 * Calculate proration for an upgrade
 * @param {Object} params
 * @param {Object} params.currentSubscription - Current subscription details
 * @param {number} params.currentPrice - Current tier price
 * @param {number} params.newPrice - New tier price
 * @param {string} params.billingCycle - Billing cycle (WEEKLY, MONTHLY, YEARLY)
 * @returns {Object} Proration details
 */
export const calculateUpgradeProration = ({
  currentSubscription,
  currentPrice,
  newPrice,
  billingCycle,
}) => {
  const now = new Date();
  const startDate = new Date(currentSubscription.startDate);
  const endDate = new Date(currentSubscription.endDate);

  // Handle case where subscription has no end date (FREE tier)
  if (!currentSubscription.endDate) {
    return {
      daysUsed: 0,
      daysRemaining: getDaysInCycle(billingCycle),
      totalDays: getDaysInCycle(billingCycle),
      unusedCredit: 0,
      newTierCost: newPrice,
      amountDue: newPrice,
      newEndDate: calculateEndDate(now, billingCycle),
      breakdown: {
        currentDailyRate: 0,
        newDailyRate: calculateDailyRate(newPrice, billingCycle),
        creditApplied: 0,
      },
    };
  }

  // Calculate days
  const totalDays = daysBetween(startDate, endDate);
  const daysUsed = daysBetween(startDate, now);
  const daysRemaining = Math.max(0, totalDays - daysUsed);

  // Calculate daily rates
  const currentDailyRate = calculateDailyRate(currentPrice, billingCycle);
  const newDailyRate = calculateDailyRate(newPrice, billingCycle);

  // Calculate credit from current plan (unused portion)
  let unusedCredit = currentDailyRate * daysRemaining;

  // Calculate cost of new tier for remaining days
  const newTierCostForRemaining = newDailyRate * daysRemaining;

  // Calculate amount due (new cost - credit)
  let amountDue = newTierCostForRemaining - unusedCredit;

  // If amount due is negative, it becomes a credit for next billing
  let creditForNextBilling = 0;
  if (amountDue < 0) {
    creditForNextBilling = Math.abs(amountDue);
    amountDue = 0;
  }

  // Round to 2 decimal places
  amountDue = Math.round(amountDue * 100) / 100;
  unusedCredit = Math.round(unusedCredit * 100) / 100;

  return {
    daysUsed,
    daysRemaining,
    totalDays,
    unusedCredit,
    newTierCost: newTierCostForRemaining,
    amountDue,
    creditForNextBilling,
    newEndDate: endDate, // Keep same end date (aligned billing)
    breakdown: {
      currentDailyRate: Math.round(currentDailyRate * 100) / 100,
      newDailyRate: Math.round(newDailyRate * 100) / 100,
      creditApplied: unusedCredit,
    },
  };
};

/**
 * Calculate end date based on billing cycle
 * @param {Date} startDate 
 * @param {string} billingCycle 
 * @returns {Date}
 */
export const calculateEndDate = (startDate, billingCycle) => {
  const date = new Date(startDate);
  switch (billingCycle) {
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
};

/**
 * Calculate grace period end date
 * @param {Date} startDate - When grace period starts
 * @param {number} graceDays - Number of grace days (default 7)
 * @returns {Date}
 */
export const calculateGracePeriodEnd = (startDate, graceDays = 7) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + graceDays);
  return date;
};

/**
 * Check if a subscription is in grace period
 * @param {Object} subscription 
 * @returns {boolean}
 */
export const isInGracePeriod = (subscription) => {
  if (!subscription.gracePeriodEnd) return false;
  return new Date() < new Date(subscription.gracePeriodEnd);
};

/**
 * Format proration details for display
 * @param {Object} proration - Proration calculation result
 * @param {string} currency - Currency code (NPR, USD)
 * @returns {Object} Formatted proration for frontend
 */
export const formatProrationForDisplay = (proration, currency = "NPR") => {
  const symbol = currency === "USD" ? "$" : "Rs.";
  
  return {
    summary: {
      daysRemaining: proration.daysRemaining,
      totalDays: proration.totalDays,
    },
    credits: {
      amount: proration.unusedCredit,
      formatted: `${symbol} ${proration.unusedCredit.toLocaleString()}`,
      description: `Credit from ${proration.daysRemaining} unused days`,
    },
    charges: {
      amount: proration.newTierCost,
      formatted: `${symbol} ${proration.newTierCost.toLocaleString()}`,
      description: `New plan for ${proration.daysRemaining} days`,
    },
    total: {
      amount: proration.amountDue,
      formatted: `${symbol} ${proration.amountDue.toLocaleString()}`,
      description: "Amount due today",
    },
    nextBilling: {
      creditForNextBilling: proration.creditForNextBilling || 0,
      formatted: proration.creditForNextBilling 
        ? `${symbol} ${proration.creditForNextBilling.toLocaleString()} credit`
        : null,
    },
    breakdown: proration.breakdown,
  };
};

/**
 * Validate if upgrade is allowed
 * @param {Object} currentTier 
 * @param {Object} newTier 
 * @returns {Object} { allowed: boolean, reason?: string }
 */
export const validateUpgrade = (currentTier, newTier) => {
  if (newTier.sortOrder <= currentTier.sortOrder) {
    return {
      allowed: false,
      reason: "Cannot upgrade to a lower or same tier. Use downgrade instead.",
    };
  }

  return { allowed: true };
};

/**
 * Validate if downgrade is allowed and calculate listing impact
 * @param {Object} currentTier 
 * @param {Object} newTier 
 * @param {number} currentListingCount 
 * @returns {Object} { allowed: boolean, excessListings: number, reason?: string }
 */
export const validateDowngrade = (currentTier, newTier, currentListingCount) => {
  if (newTier.sortOrder >= currentTier.sortOrder) {
    return {
      allowed: false,
      excessListings: 0,
      reason: "Cannot downgrade to a higher or same tier. Use upgrade instead.",
    };
  }

  const newLimit = newTier.maxListings === -1 ? Infinity : newTier.maxListings;
  const excessListings = Math.max(0, currentListingCount - newLimit);

  return {
    allowed: true,
    excessListings,
    newLimit: newTier.maxListings,
    currentCount: currentListingCount,
    requiresListingSelection: excessListings > 0,
  };
};

export default {
  daysBetween,
  getDaysInCycle,
  calculateDailyRate,
  calculateUpgradeProration,
  calculateEndDate,
  calculateGracePeriodEnd,
  isInGracePeriod,
  formatProrationForDisplay,
  validateUpgrade,
  validateDowngrade,
};