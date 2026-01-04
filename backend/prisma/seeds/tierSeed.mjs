// ==========================================
// SEED SCRIPT FOR HOST TIERS (ESM)
// ==========================================
// Run with: node --loader esm prisma/seeds/tierSeed.mjs
// ==========================================

import 'dotenv/config'; // loads .env automatically
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default Tier Definitions
const DEFAULT_TIERS = {
  FREE: {
    name: "FREE",
    displayName: "Free",
    description: "Get started with basic features",
    maxListings: 2,
    maxPhotosPerListing: 5,
    maxBlogPostsPerMonth: 2,
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
    maxBlogPostsPerMonth: 5,
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
    maxBlogPostsPerMonth: 15,
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
    maxListings: -1,
    maxPhotosPerListing: 25,
    maxBlogPostsPerMonth: -1,
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

// NPR Pricing
const DEFAULT_PRICING_NPR = {
  FREE: { MONTHLY: { price: 0, discount: 0, finalPrice: 0 }, YEARLY: { price: 0, discount: 0, finalPrice: 0 } },
  BASIC: { 
    MONTHLY: { price: 499, discount: 0, finalPrice: 499 }, YEARLY: { price: 5988, discount: 16, finalPrice: 4999 } },
  PRO: { 
    MONTHLY: { price: 999, discount: 0, finalPrice: 999 }, YEARLY: { price: 11988, discount: 16, finalPrice: 9999 } },
  PREMIUM: { 
    MONTHLY: { price: 1999, discount: 0, finalPrice: 1999 }, YEARLY: { price: 23988, discount: 16, finalPrice: 19999 } },
};

// USD Pricing
const DEFAULT_PRICING_USD = {
  FREE: { 
    MONTHLY: { price: 0, discount: 0, finalPrice: 0 }, YEARLY: { price: 0, discount: 0, finalPrice: 0 } },
  BASIC: { 
    MONTHLY: { price: 5, discount: 0, finalPrice: 5 }, YEARLY: { price: 60, discount: 18, finalPrice: 49 } },
  PRO: { 
    MONTHLY: { price: 10, discount: 0, finalPrice: 10 }, YEARLY: { price: 120, discount: 17, finalPrice: 99 } },
  PREMIUM: { 
    MONTHLY: { price: 20, discount: 0, finalPrice: 20 }, YEARLY: { price: 240, discount: 17, finalPrice: 199 } },
};

// Payment Gateways
const PAYMENT_GATEWAYS = [
  { gateway: "ESEWA", displayName: "eSewa", merchantId: "EPAYTEST", secretKey: "8gBm/:&EnhH.10Le", baseUrl: "https://uat.esewa.com.np", isActive: true, isTestMode: true, currencies: ["NPR"], countries: ["NP"] },
  { gateway: "KHALTI", displayName: "Khalti", publicKey: "test_public_key_xxx", secretKey: "test_secret_key_xxx", baseUrl: "https://a.khalti.com/api/v2", isActive: true, isTestMode: true, currencies: ["NPR"], countries: ["NP"] },
  { gateway: "DODO", displayName: "Card Payment (Dodo)", publicKey: "test_public_key_xxx", secretKey: "test_secret_key_xxx", baseUrl: "https://api.dodopayments.com", isActive: true, isTestMode: true, currencies: ["USD"], countries: ["*"] },
];

async function seedTiers() {
  console.log("🌱 Seeding host tiers...\n");
  const existingTiers = await prisma.hostTier.count();
  if (existingTiers > 0) return console.log("⚠️ Tiers already exist, skipping seed.");

  for (const [key, tierData] of Object.entries(DEFAULT_TIERS)) {
    console.log(`Creating tier: ${tierData.displayName}...`);
    const tier = await prisma.hostTier.create({ data: { ...tierData, isActive: true } });

    for (const [cycle, prices] of Object.entries(DEFAULT_PRICING_NPR[key])) {
      await prisma.tierPricing.create({ data: { tierId: tier.id, billingCycle: cycle, currency: "NPR", ...prices, isActive: true } });
    }

    for (const [cycle, prices] of Object.entries(DEFAULT_PRICING_USD[key])) {
      await prisma.tierPricing.create({ data: { tierId: tier.id, billingCycle: cycle, currency: "USD", ...prices, isActive: true } });
    }

    console.log(`✅ ${tierData.displayName} tier created with pricing\n`);
  }

  console.log("✅ All tiers seeded successfully!\n");
}

async function seedPaymentGateways() {
  console.log("🌱 Seeding payment gateways...\n");
  
  // Force insert using upsert instead of checking count
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

async function main() {
  try {
    await seedTiers();
    await seedPaymentGateways();

    const tierCount = await prisma.hostTier.count();
    const pricingCount = await prisma.tierPricing.count();
    const gatewayCount = await prisma.paymentGatewayConfig.count();

    console.log(`Tiers: ${tierCount}, Pricing: ${pricingCount}, Gateways: ${gatewayCount}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
