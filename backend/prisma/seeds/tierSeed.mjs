// ==========================================
// SEED SCRIPT FOR HOST TIERS (ESM)
// ==========================================
// Run with: node prisma/seeds/tierSeed.mjs
// Last Updated: Removed maxBlogPostsPerMonth
// Reason: Hosts use ListingStory (1:1 with Listing), not BlogPost
// ==========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==========================================
// DEFAULT TIER DEFINITIONS
// ==========================================
// Note: Hosts use ListingStory (1 per listing) instead of BlogPost
// Each listing can have one story, so story limit = listing limit

const DEFAULT_TIERS = {
  FREE: {
    name: "FREE",
    displayName: "Free",
    description: "Get started with basic features",
    maxListings: 2,
    maxPhotosPerListing: 5,
    featuredListingSlots: 0,
    commissionPercent: 10,
    trialDays: 0,
    sortOrder: 1,
    features: {
      verifiedBadge: false,
      prioritySearch: "none",
      analytics: "views_only",
      calendarSync: true,
      instantBooking: true,
    },
  },
  BASIC: {
    name: "BASIC",
    displayName: "Basic",
    description: "Perfect for getting started",
    maxListings: 5,
    maxPhotosPerListing: 10,
    featuredListingSlots: 1,
    commissionPercent: 7,
    trialDays: 30,
    sortOrder: 2,
    features: {
      verifiedBadge: false,
      prioritySearch: "none",
      analytics: "basic",
      calendarSync: true,
      instantBooking: true,
    },
  },
  PRO: {
    name: "PRO",
    displayName: "Pro",
    description: "For growing businesses",
    maxListings: 15,
    maxPhotosPerListing: 15,
    featuredListingSlots: 3,
    commissionPercent: 5,
    trialDays: 30,
    sortOrder: 3,
    features: {
      verifiedBadge: true,
      prioritySearch: "slight_boost",
      analytics: "detailed",
      calendarSync: true,
      instantBooking: true,
    },
  },
  PREMIUM: {
    name: "PREMIUM",
    displayName: "Premium",
    description: "Maximum features & lowest commission",
    maxListings: -1, // Unlimited
    maxPhotosPerListing: 25,
    featuredListingSlots: 5,
    commissionPercent: 3,
    trialDays: 14,
    sortOrder: 4,
    features: {
      verifiedBadge: true,
      prioritySearch: "top_priority",
      analytics: "full_export",
      calendarSync: true,
      instantBooking: true,
    },
  },
};

// ==========================================
// NPR PRICING
// ==========================================

const DEFAULT_PRICING_NPR = {
  FREE: {
    MONTHLY: { price: 0, discountPercent: 0, finalPrice: 0 },
    YEARLY: { price: 0, discountPercent: 0, finalPrice: 0 },
  },
  BASIC: {
    MONTHLY: { price: 499, discountPercent: 0, finalPrice: 499 },
    YEARLY: { price: 5988, discountPercent: 16, finalPrice: 4999 },
  },
  PRO: {
    MONTHLY: { price: 999, discountPercent: 0, finalPrice: 999 },
    YEARLY: { price: 11988, discountPercent: 16, finalPrice: 9999 },
  },
  PREMIUM: {
    MONTHLY: { price: 1999, discountPercent: 0, finalPrice: 1999 },
    YEARLY: { price: 23988, discountPercent: 16, finalPrice: 19999 },
  },
};

// ==========================================
// USD PRICING
// ==========================================

const DEFAULT_PRICING_USD = {
  FREE: {
    MONTHLY: { price: 0, discountPercent: 0, finalPrice: 0 },
    YEARLY: { price: 0, discountPercent: 0, finalPrice: 0 },
  },
  BASIC: {
    MONTHLY: { price: 5, discountPercent: 0, finalPrice: 5 },
    YEARLY: { price: 60, discountPercent: 18, finalPrice: 49 },
  },
  PRO: {
    MONTHLY: { price: 10, discountPercent: 0, finalPrice: 10 },
    YEARLY: { price: 120, discountPercent: 17, finalPrice: 99 },
  },
  PREMIUM: {
    MONTHLY: { price: 20, discountPercent: 0, finalPrice: 20 },
    YEARLY: { price: 240, discountPercent: 17, finalPrice: 199 },
  },
};

// ==========================================
// PAYMENT GATEWAYS
// ==========================================

const PAYMENT_GATEWAYS = [
  {
    gateway: "ESEWA",
    displayName: "eSewa",
    merchantId: "EPAYTEST",
    secretKey: "8gBm/:&EnhH.1/q",
    baseUrl: "https://uat.esewa.com.np",
    isActive: true,
    isTestMode: true,
    currencies: ["NPR"],
    countries: ["NP"],
  },
  {
    gateway: "KHALTI",
    displayName: "Khalti",
    publicKey: "test_public_key_xxx",
    secretKey: "test_secret_key_xxx",
    baseUrl: "https://a.khalti.com/api/v2",
    isActive: true,
    isTestMode: true,
    currencies: ["NPR"],
    countries: ["NP"],
  },
  {
    gateway: "DODO",
    displayName: "Card Payment (Dodo)",
    publicKey: "test_public_key_xxx",
    secretKey: "test_secret_key_xxx",
    baseUrl: "https://api.dodopayments.com",
    isActive: true,
    isTestMode: true,
    currencies: ["USD"],
    countries: ["*"],
  },
];

// ==========================================
// SEED FUNCTIONS
// ==========================================

async function seedTiers() {
  console.log("🌱 Seeding host tiers...\n");

  const existingTiers = await prisma.hostTier.count();
  if (existingTiers > 0) {
    console.log("⚠️ Tiers already exist, skipping seed.");
    return;
  }

  for (const [key, tierData] of Object.entries(DEFAULT_TIERS)) {
    console.log(`Creating tier: ${tierData.displayName}...`);

    const tier = await prisma.hostTier.create({
      data: {
        ...tierData,
        isActive: true,
      },
    });

    // Create NPR pricing
    for (const [cycle, prices] of Object.entries(DEFAULT_PRICING_NPR[key])) {
      await prisma.tierPricing.create({
        data: {
          tierId: tier.id,
          billingCycle: cycle,
          currency: "NPR",
          ...prices,
          isActive: true,
        },
      });
    }

    // Create USD pricing
    for (const [cycle, prices] of Object.entries(DEFAULT_PRICING_USD[key])) {
      await prisma.tierPricing.create({
        data: {
          tierId: tier.id,
          billingCycle: cycle,
          currency: "USD",
          ...prices,
          isActive: true,
        },
      });
    }

    console.log(`✅ ${tierData.displayName} tier created with pricing\n`);
  }

  console.log("✅ All tiers seeded successfully!\n");
}

async function seedPaymentGateways() {
  console.log("🌱 Seeding payment gateways...\n");

  for (const gateway of PAYMENT_GATEWAYS) {
    console.log(`Upserting gateway: ${gateway.displayName}...`);

    await prisma.paymentGatewayConfig.upsert({
      where: { gateway: gateway.gateway },
      update: gateway,
      create: gateway,
    });

    console.log(`✅ ${gateway.displayName} upserted\n`);
  }

  console.log("✅ All payment gateways seeded successfully!\n");
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  try {
    console.log("==========================================");
    console.log("🚀 Starting Tier & Payment Gateway Seed");
    console.log("==========================================\n");

    await seedTiers();
    await seedPaymentGateways();

    // Summary
    const tierCount = await prisma.hostTier.count();
    const pricingCount = await prisma.tierPricing.count();
    const gatewayCount = await prisma.paymentGatewayConfig.count();

    console.log("==========================================");
    console.log("📊 Seed Summary:");
    console.log(`   Tiers: ${tierCount}`);
    console.log(`   Pricing Records: ${pricingCount}`);
    console.log(`   Payment Gateways: ${gatewayCount}`);
    console.log("==========================================\n");

    console.log("✅ Seed completed successfully!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();