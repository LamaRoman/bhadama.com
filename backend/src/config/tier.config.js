// ==========================================
// HOST TIER SYSTEM - CONSTANTS & CONFIG
// ==========================================

// Tier Types
export const TIER_TYPES = {
  FREE: "FREE",
  BASIC: "BASIC",
  PRO: "PRO",
  PREMIUM: "PREMIUM",
};

// Billing Cycles
export const BILLING_CYCLES = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  TRIAL: "TRIAL",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  PAST_DUE: "PAST_DUE",
  PAUSED: "PAUSED",
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
};

// Payment Gateways
export const PAYMENT_GATEWAYS = {
  ESEWA: "ESEWA",
  KHALTI: "KHALTI",
  DODO: "DODO",
  MANUAL: "MANUAL",
  PENDING: "PENDING",
};

// Currencies
export const CURRENCIES = {
  NPR: "NPR",
  USD: "USD",
  INR: "INR",
};

// ==========================================
// DEFAULT TIER CONFIGURATION
// ==========================================

export const DEFAULT_TIERS = {
  FREE: {
    name: "FREE",
    displayName: "Free",
    description: "Perfect for getting started",
    maxListings: 2,
    maxPhotosPerListing: 5,
    featuredListingSlots: 0,
    commissionPercent: 10.0,
    trialDays: 0,
    features: {
      verifiedBadge: false,
      prioritySearch: "none",
      analytics: "views_only",
      calendarSync: true,
      instantBooking: true,
    },
    sortOrder: 1,
  },
  BASIC: {
    name: "BASIC",
    displayName: "Basic",
    description: "Great for active hosts",
    maxListings: 5,
    maxPhotosPerListing: 10,
    maxBlogPostsPerMonth: 5,
    featuredListingSlots: 1,
    commissionPercent: 7.0,
    trialDays: 30,
    features: {
      verifiedBadge: false,
      prioritySearch: "none",
      analytics: "basic",
      calendarSync: true,
      instantBooking: true,
    },
    sortOrder: 2,
  },
  PRO: {
    name: "PRO",
    displayName: "Pro",
    description: "For serious hosts",
    maxListings: 15,
    maxPhotosPerListing: 15,
    maxBlogPostsPerMonth: 15,
    featuredListingSlots: 3,
    commissionPercent: 5.0,
    trialDays: 30,
    features: {
      verifiedBadge: true,
      prioritySearch: "slight_boost",
      analytics: "detailed",
      calendarSync: true,
      instantBooking: true,
    },
    sortOrder: 3,
  },
  PREMIUM: {
    name: "PREMIUM",
    displayName: "Premium",
    description: "Maximum benefits for professionals",
    maxListings: -1, // Unlimited
    maxPhotosPerListing: 25,
    maxBlogPostsPerMonth: -1, // Unlimited
    featuredListingSlots: 5,
    commissionPercent: 3.0,
    trialDays: 14,
    features: {
      verifiedBadge: true,
      prioritySearch: "top_priority",
      analytics: "full_export",
      calendarSync: true,
      instantBooking: true,
    },
    sortOrder: 4,
  },
};

// ==========================================
// DEFAULT PRICING (NPR)
// ==========================================

export const DEFAULT_PRICING_NPR = {
  FREE: {
    WEEKLY: { price: 0, discount: 0, finalPrice: 0 },
    MONTHLY: { price: 0, discount: 0, finalPrice: 0 },
    YEARLY: { price: 0, discount: 0, finalPrice: 0 },
  },
  BASIC: {
    WEEKLY: { price: 149, discount: 0, finalPrice: 149 },
    MONTHLY: { price: 499, discount: 0, finalPrice: 499 },
    YEARLY: { price: 5988, discount: 16, finalPrice: 4999 }, // ~16% off
  },
  PRO: {
    WEEKLY: { price: 299, discount: 0, finalPrice: 299 },
    MONTHLY: { price: 999, discount: 0, finalPrice: 999 },
    YEARLY: { price: 11988, discount: 16, finalPrice: 9999 }, // ~16% off
  },
  PREMIUM: {
    WEEKLY: { price: 599, discount: 0, finalPrice: 599 },
    MONTHLY: { price: 1999, discount: 0, finalPrice: 1999 },
    YEARLY: { price: 23988, discount: 16, finalPrice: 19999 }, // ~16% off
  },
};

// ==========================================
// DEFAULT PRICING (USD)
// ==========================================

export const DEFAULT_PRICING_USD = {
  FREE: {
    WEEKLY: { price: 0, discount: 0, finalPrice: 0 },
    MONTHLY: { price: 0, discount: 0, finalPrice: 0 },
    YEARLY: { price: 0, discount: 0, finalPrice: 0 },
  },
  BASIC: {
    WEEKLY: { price: 1.5, discount: 0, finalPrice: 1.5 },
    MONTHLY: { price: 5, discount: 0, finalPrice: 5 },
    YEARLY: { price: 60, discount: 18, finalPrice: 49 },
  },
  PRO: {
    WEEKLY: { price: 3, discount: 0, finalPrice: 3 },
    MONTHLY: { price: 10, discount: 0, finalPrice: 10 },
    YEARLY: { price: 120, discount: 17, finalPrice: 99 },
  },
  PREMIUM: {
    WEEKLY: { price: 6, discount: 0, finalPrice: 6 },
    MONTHLY: { price: 20, discount: 0, finalPrice: 20 },
    YEARLY: { price: 240, discount: 17, finalPrice: 199 },
  },
};

// ==========================================
// SUPPORT CONFIG (Separate from tiers)
// ==========================================
// Support is NOT a tier feature - all hosts get same support
// This is displayed in a dedicated Support tab

export const SUPPORT_CONFIG = {
  NP: { // Nepal
    channels: ["email", "phone"],
    email: "support@mybigyard.com",
    phone: "+977-XXXXXXXXXX",
    description: "Email & Phone Support",
  },
  INTERNATIONAL: {
    channels: ["email", "chat"],
    email: "support@mybigyard.com",
    chatStatus: "coming_soon",
    description: "Email & Chat (Coming Soon)",
  },
};

// ==========================================
// GRACE PERIOD CONFIG
// ==========================================

export const GRACE_PERIOD = {
  DAYS: 7,
  ACTIONS: {
    DAY_0: "subscription_expired_email",
    DAY_1_3: "daily_reminder_email",
    DAY_4_7: "listings_badge_warning",
    DAY_8_PLUS: "listings_hidden",
  },
};

// ==========================================
// DOWNGRADE RULES
// ==========================================

export const DOWNGRADE_RULES = {
  GRACE_DAYS: 7, // Days to choose which listings to keep
  AUTO_DEACTIVATE: true, // Auto-deactivate oldest if not chosen
  PRESERVE_DATA: true, // Never delete, just hide
};

// ==========================================
// PAYMENT GATEWAY REGIONS
// ==========================================

export const GATEWAY_REGIONS = {
  NP: ["ESEWA", "KHALTI", "DODO"], // Nepal - local wallets + international cards
  INTERNATIONAL: ["DODO"],          // International - cards only (Visa, Mastercard, Amex, Discover)
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Get tier display info
export const getTierInfo = (tierType) => {
  return DEFAULT_TIERS[tierType] || DEFAULT_TIERS.FREE;
};

// Get pricing for tier
export const getTierPricing = (tierType, currency = "NPR") => {
  const pricing = currency === "USD" ? DEFAULT_PRICING_USD : DEFAULT_PRICING_NPR;
  return pricing[tierType] || pricing.FREE;
};

// Check if tier allows feature
export const tierHasFeature = (tierType, feature) => {
  const tier = DEFAULT_TIERS[tierType];
  if (!tier || !tier.features) return false;
  return tier.features[feature] === true || tier.features[feature];
};

// Get commission for tier
export const getTierCommission = (tierType) => {
  const tier = DEFAULT_TIERS[tierType];
  return tier ? tier.commissionPercent : 10.0;
};

// Check listing limit
export const canCreateListing = (tierType, currentListingCount) => {
  const tier = DEFAULT_TIERS[tierType];
  if (!tier) return false;
  if (tier.maxListings === -1) return true; // Unlimited
  return currentListingCount < tier.maxListings;
};

// Get available gateways for country
export const getAvailableGateways = (countryCode) => {
  if (countryCode === "NP") {
    return GATEWAY_REGIONS.NP;
  }
  return GATEWAY_REGIONS.INTERNATIONAL;
};

// Calculate subscription end date
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

// Calculate trial end date
export const calculateTrialEndDate = (startDate, tierType) => {
  const tier = DEFAULT_TIERS[tierType];
  if (!tier || tier.trialDays === 0) return null;
  
  const date = new Date(startDate);
  date.setDate(date.getDate() + tier.trialDays);
  return date;
};

// Format price with currency
export const formatPrice = (amount, currency = "NPR") => {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  return `NPR ${amount.toLocaleString()}`;
};

export default {
  TIER_TYPES,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_GATEWAYS,
  CURRENCIES,
  DEFAULT_TIERS,
  DEFAULT_PRICING_NPR,
  DEFAULT_PRICING_USD,
  SUPPORT_CONFIG,
  GRACE_PERIOD,
  DOWNGRADE_RULES,
  GATEWAY_REGIONS,
};