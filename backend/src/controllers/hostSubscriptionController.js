// ==========================================
// HOST SUBSCRIPTION CONTROLLER (UPDATED)
// ==========================================
// Handles subscription management with proration support
// ==========================================

import { PrismaClient } from "@prisma/client";
import {
  TIER_TYPES,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  calculateEndDate,
  calculateTrialEndDate,
  getTierCommission,
  canCreateListing,
  formatPrice,
  getAvailableGateways,
  DOWNGRADE_RULES,
} from "../config/tierConfig.js";
import {
  getUpgradePreview,
  executeUpgrade,
  getDowngradePreview,
  executeDowngrade,
  getOverLimitListings,
  selectListingsToKeep,
} from "../services/tierChangeService.js";
import {
  getArchivedListings,
  restoreListing,
} from "../services/listingArchiveService.js";

const prisma = new PrismaClient();

// ==========================================
// GET AVAILABLE TIERS (Public)
// ==========================================

export const getAvailableTiers = async (req, res) => {
  try {
    const { currency = "NPR" } = req.query;

    const tiers = await prisma.hostTier.findMany({
      where: { isActive: true },
      include: {
        pricing: {
          where: {
            isActive: true,
            currency: currency,
          },
          orderBy: { billingCycle: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Format for frontend
    const formattedTiers = tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      displayName: tier.displayName,
      description: tier.description,
      features: {
        maxListings: tier.maxListings === -1 ? "Unlimited" : tier.maxListings,
        maxPhotosPerListing: tier.maxPhotosPerListing,
        maxBlogPostsPerMonth:
          tier.maxBlogPostsPerMonth === -1
            ? "Unlimited"
            : tier.maxBlogPostsPerMonth,
        featuredListingSlots: tier.featuredListingSlots,
        commissionPercent: tier.commissionPercent,
        verifiedBadge: tier.features?.verifiedBadge || false,
        prioritySearch: tier.features?.prioritySearch || "none",
        analytics: tier.features?.analytics || "views_only",
        calendarSync: tier.features?.calendarSync || true,
        instantBooking: tier.features?.instantBooking || true,
      },
      trialDays: tier.trialDays,
      pricing: tier.pricing.reduce((acc, p) => {
        acc[p.billingCycle] = {
          price: p.price,
          discountPercent: p.discountPercent,
          finalPrice: p.finalPrice,
          formatted: formatPrice(p.finalPrice, currency),
        };
        return acc;
      }, {}),
    }));

    res.json({ tiers: formattedTiers, currency });
  } catch (error) {
    console.error("Get available tiers error:", error);
    res.status(500).json({ error: "Failed to fetch tiers" });
  }
};

// ==========================================
// GET CURRENT SUBSCRIPTION
// ==========================================

export const getCurrentSubscription = async (req, res) => {
  try {
    const hostId = req.user.id;

    const subscription = await prisma.hostSubscription.findFirst({
      where: { hostId },
      include: {
        tier: {
          include: {
            pricing: { where: { isActive: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      // Return FREE tier info if no subscription
      const freeTier = await prisma.hostTier.findUnique({
        where: { name: "FREE" },
      });

      return res.json({
        subscription: null,
        currentTier: {
          name: "FREE",
          displayName: "Free",
          ...freeTier,
        },
        isFreeTier: true,
      });
    }

    // Check if expired
    const isExpired =
      subscription.endDate && new Date(subscription.endDate) < new Date();
    const isInTrial =
      subscription.status === "TRIAL" &&
      subscription.trialEndDate &&
      new Date(subscription.trialEndDate) > new Date();

    // Days remaining
    let daysRemaining = null;
    if (subscription.endDate) {
      const diff = new Date(subscription.endDate) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Grace period info
    let gracePeriodInfo = null;
    if (subscription.gracePeriodEnd) {
      const graceEnd = new Date(subscription.gracePeriodEnd);
      const now = new Date();
      if (graceEnd > now) {
        const graceDaysRemaining = Math.ceil(
          (graceEnd - now) / (1000 * 60 * 60 * 24)
        );
        gracePeriodInfo = {
          active: true,
          endsAt: subscription.gracePeriodEnd,
          daysRemaining: graceDaysRemaining,
          excessListings: subscription.excessListingsCount,
        };
      }
    }

    res.json({
      subscription: {
        ...subscription,
        isExpired,
        isInTrial,
        daysRemaining,
        gracePeriodInfo,
      },
      currentTier: subscription.tier,
      isFreeTier: subscription.tier.name === "FREE",
    });
  } catch (error) {
    console.error("Get current subscription error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// ==========================================
// SELECT/START TIER (Initial subscription)
// ==========================================

export const selectTier = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { tierId, billingCycle, currency = "NPR" } = req.body;

    // Validate
    if (!tierId) {
      return res.status(400).json({ error: "Tier ID is required" });
    }

    // Get tier
    const tier = await prisma.hostTier.findUnique({
      where: { id: parseInt(tierId) },
      include: {
        pricing: {
          where: {
            billingCycle: billingCycle || "MONTHLY",
            currency,
            isActive: true,
          },
        },
      },
    });

    if (!tier || !tier.isActive) {
      return res.status(404).json({ error: "Tier not found or inactive" });
    }

    // Check for existing subscription
    const existingSubscription = await prisma.hostSubscription.findFirst({
      where: {
        hostId,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
      include: { tier: true },
    });

    // If already has subscription, redirect to change tier
    if (existingSubscription) {
      return res.status(400).json({
        error: "You already have an active subscription. Use upgrade/downgrade instead.",
        currentTier: existingSubscription.tier.name,
        redirectTo: "/host/subscription/manage",
      });
    }

    // FREE tier - create immediately
    if (tier.name === "FREE") {
      const subscription = await prisma.hostSubscription.create({
        data: {
          hostId,
          tierId: tier.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: null, // Never expires
        },
      });

      // Update user
      await prisma.user.update({
        where: { id: hostId },
        data: {
          currentTier: "FREE",
          tierExpiresAt: null,
        },
      });

      // Log history
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          action: "created",
          toTier: "FREE",
          changedByType: "host",
        },
      });

      return res.json({
        message: "Free tier activated",
        subscription,
        requiresPayment: false,
      });
    }

    // PAID tier - check pricing
    if (!tier.pricing || tier.pricing.length === 0) {
      return res
        .status(400)
        .json({ error: "No pricing available for this tier" });
    }

    const pricing = tier.pricing[0];

    // Check if eligible for trial
    const hasUsedTrial = await prisma.subscriptionHistory.findFirst({
      where: {
        subscription: { hostId },
        action: { in: ["trial_started", "created"] },
        toTier: tier.name,
      },
    });

    const eligibleForTrial = tier.trialDays > 0 && !hasUsedTrial;

    // If eligible for trial, start trial
    if (eligibleForTrial) {
      const trialEndDate = calculateTrialEndDate(new Date(), tier.name);

      const subscription = await prisma.hostSubscription.create({
        data: {
          hostId,
          tierId: tier.id,
          billingCycle: billingCycle || "MONTHLY",
          currency,
          status: "TRIAL",
          startDate: new Date(),
          trialEndDate,
          endDate: trialEndDate, // Trial end = subscription end initially
        },
      });

      // Update user
      await prisma.user.update({
        where: { id: hostId },
        data: {
          currentTier: tier.name,
          tierExpiresAt: trialEndDate,
        },
      });

      // Log history
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          action: "trial_started",
          fromTier: "FREE",
          toTier: tier.name,
          details: { trialDays: tier.trialDays },
          changedByType: "host",
        },
      });

      return res.json({
        message: `${tier.trialDays}-day free trial started for ${tier.displayName}`,
        subscription,
        requiresPayment: false,
        trialEndDate,
      });
    }

    // No trial - requires payment
    const endDate = calculateEndDate(new Date(), billingCycle || "MONTHLY");

    const subscription = await prisma.hostSubscription.create({
      data: {
        hostId,
        tierId: tier.id,
        billingCycle: billingCycle || "MONTHLY",
        currency,
        status: "PENDING",
        startDate: new Date(),
        endDate,
      },
    });

    // Create pending payment
    const payment = await prisma.payment.create({
      data: {
        hostId,
        subscriptionId: subscription.id,
        amount: pricing.finalPrice,
        currency,
        gateway: "PENDING", // Will be updated when user selects payment method
        status: "PENDING",
        type: "FULL",
        description: `${tier.displayName} Plan - ${billingCycle || "Monthly"}`,
        periodStart: new Date(),
        periodEnd: endDate,
      },
    });

    res.json({
      message: "Please complete payment to activate subscription",
      subscription,
      payment,
      requiresPayment: true,
      amount: pricing.finalPrice,
      formattedAmount: formatPrice(pricing.finalPrice, currency),
      availableGateways: getAvailableGateways(req.user.country || "NP"),
    });
  } catch (error) {
    console.error("Select tier error:", error);
    res.status(500).json({ error: "Failed to select tier" });
  }
};

// ==========================================
// UPGRADE PREVIEW (NEW)
// ==========================================

export const getUpgradePreviewEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { newTierId, billingCycle } = req.query;

    if (!newTierId) {
      return res.status(400).json({ error: "New tier ID is required" });
    }

    const preview = await getUpgradePreview(
      hostId,
      parseInt(newTierId),
      billingCycle
    );

    res.json(preview);
  } catch (error) {
    console.error("Get upgrade preview error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// EXECUTE UPGRADE (NEW)
// ==========================================

export const upgradeSubscription = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { newTierId, billingCycle } = req.body;

    if (!newTierId) {
      return res.status(400).json({ error: "New tier ID is required" });
    }

    const result = await executeUpgrade(hostId, parseInt(newTierId), billingCycle);

    if (result.requiresPayment) {
      res.json({
        ...result,
        redirectTo: `/host/payment?payment=${result.payment.id}`,
        availableGateways: getAvailableGateways(req.user.country || "NP"),
      });
    } else {
      // Credit covers the upgrade
      res.json({
        ...result,
        message: "Upgrade applied with credit from your current plan",
      });
    }
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// DOWNGRADE PREVIEW (NEW)
// ==========================================

export const getDowngradePreviewEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { newTierId } = req.query;

    if (!newTierId) {
      return res.status(400).json({ error: "New tier ID is required" });
    }

    const preview = await getDowngradePreview(hostId, parseInt(newTierId));

    res.json(preview);
  } catch (error) {
    console.error("Get downgrade preview error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// EXECUTE DOWNGRADE (NEW)
// ==========================================

export const downgradeSubscription = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { newTierId } = req.body;

    if (!newTierId) {
      return res.status(400).json({ error: "New tier ID is required" });
    }

    const result = await executeDowngrade(hostId, parseInt(newTierId));

    res.json({
      ...result,
      redirectTo: result.gracePeriod
        ? "/host/listings/select-to-keep"
        : "/host/dashboard",
    });
  } catch (error) {
    console.error("Downgrade subscription error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// GET OVER-LIMIT LISTINGS (NEW)
// ==========================================

export const getOverLimitListingsEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const result = await getOverLimitListings(hostId);
    res.json(result);
  } catch (error) {
    console.error("Get over-limit listings error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// SELECT LISTINGS TO KEEP (NEW)
// ==========================================

export const selectListingsToKeepEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { listingIds } = req.body;

    if (!listingIds || !Array.isArray(listingIds)) {
      return res.status(400).json({ error: "Listing IDs array is required" });
    }

    const result = await selectListingsToKeep(hostId, listingIds);
    res.json(result);
  } catch (error) {
    console.error("Select listings to keep error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// GET ARCHIVED LISTINGS (NEW)
// ==========================================

export const getArchivedListingsEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const result = await getArchivedListings(hostId);
    res.json(result);
  } catch (error) {
    console.error("Get archived listings error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// RESTORE ARCHIVED LISTING (NEW)
// ==========================================

export const restoreListingEndpoint = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { listingId } = req.params;

    const result = await restoreListing(hostId, parseInt(listingId));
    res.json(result);
  } catch (error) {
    console.error("Restore listing error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ==========================================
// CANCEL SUBSCRIPTION
// ==========================================

export const cancelSubscription = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { reason } = req.body;

    const subscription = await prisma.hostSubscription.findFirst({
      where: {
        hostId,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
      include: { tier: true },
    });

    if (!subscription) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    if (subscription.tier.name === "FREE") {
      return res.status(400).json({ error: "Cannot cancel free tier" });
    }

    // Set to not auto-renew, will expire at end date
    await prisma.hostSubscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "cancelled",
        fromTier: subscription.tier.name,
        details: { reason, willExpireAt: subscription.endDate },
        changedByType: "host",
      },
    });

    // Get listing count to warn about potential archival
    const listingCount = await prisma.listing.count({
      where: {
        hostId,
        status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
      },
    });

    const freeTier = await prisma.hostTier.findUnique({
      where: { name: "FREE" },
    });

    const excessListings = Math.max(0, listingCount - freeTier.maxListings);

    res.json({
      message:
        "Subscription cancelled. You will retain access until " +
        new Date(subscription.endDate).toLocaleDateString(),
      expiresAt: subscription.endDate,
      warning:
        excessListings > 0
          ? `You have ${listingCount} listings. After expiry, you'll need to select ${freeTier.maxListings} to keep active.`
          : null,
      excessListings,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// ==========================================
// CHECK TIER LIMITS
// ==========================================

export const checkTierLimits = async (req, res) => {
  try {
    const hostId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: hostId },
      select: { currentTier: true },
    });

    const tier = await prisma.hostTier.findUnique({
      where: { name: user.currentTier || "FREE" },
    });

    // Get current usage
    const [listingCount, blogCount, overLimitCount, archivedCount] =
      await Promise.all([
        prisma.listing.count({
          where: { hostId, status: { in: ["ACTIVE", "INACTIVE", "PENDING"] } },
        }),
        prisma.blogPost.count({
          where: {
            authorId: hostId,
            createdAt: {
              gte: new Date(new Date().setDate(1)), // This month
            },
          },
        }),
        prisma.listing.count({
          where: { hostId, status: "OVER_LIMIT" },
        }),
        prisma.listing.count({
          where: { hostId, status: "ARCHIVED" },
        }),
      ]);

    const limits = {
      listings: {
        used: listingCount,
        max: tier.maxListings,
        unlimited: tier.maxListings === -1,
        canCreate: tier.maxListings === -1 || listingCount < tier.maxListings,
        overLimit: overLimitCount,
        archived: archivedCount,
      },
      blogPosts: {
        used: blogCount,
        max: tier.maxBlogPostsPerMonth,
        unlimited: tier.maxBlogPostsPerMonth === -1,
        canCreate:
          tier.maxBlogPostsPerMonth === -1 ||
          blogCount < tier.maxBlogPostsPerMonth,
      },
      photosPerListing: tier.maxPhotosPerListing,
      featuredSlots: tier.featuredListingSlots,
      commission: tier.commissionPercent,
    };

    res.json({
      tier: tier.name,
      tierDisplayName: tier.displayName,
      limits,
    });
  } catch (error) {
    console.error("Check tier limits error:", error);
    res.status(500).json({ error: "Failed to check limits" });
  }
};

// ==========================================
// GET SUBSCRIPTION HISTORY
// ==========================================

export const getSubscriptionHistory = async (req, res) => {
  try {
    const hostId = req.user.id;

    const subscription = await prisma.hostSubscription.findFirst({
      where: { hostId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return res.json({ history: [] });
    }

    const history = await prisma.subscriptionHistory.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ history });
  } catch (error) {
    console.error("Get subscription history error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// ==========================================
// LEGACY CHANGE TIER (Kept for backward compatibility)
// ==========================================

export const changeTier = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { newTierId, billingCycle } = req.body;

    // Get current subscription to determine if upgrade or downgrade
    const currentSubscription = await prisma.hostSubscription.findFirst({
      where: {
        hostId,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
      include: { tier: true },
    });

    if (!currentSubscription) {
      return res.status(400).json({
        error: "No active subscription. Use select tier instead.",
        redirectTo: "/host/select-tier",
      });
    }

    const newTier = await prisma.hostTier.findUnique({
      where: { id: parseInt(newTierId) },
    });

    if (!newTier) {
      return res.status(404).json({ error: "Tier not found" });
    }

    // Determine if upgrade or downgrade based on sortOrder
    const isUpgrade = newTier.sortOrder > currentSubscription.tier.sortOrder;

    if (isUpgrade) {
      // Redirect to upgrade endpoint
      return res.json({
        message: "Use the upgrade endpoint for upgrades",
        isUpgrade: true,
        redirectTo: `/api/host/tier/subscription/upgrade-preview?newTierId=${newTierId}`,
      });
    } else {
      // Redirect to downgrade endpoint
      return res.json({
        message: "Use the downgrade endpoint for downgrades",
        isUpgrade: false,
        redirectTo: `/api/host/tier/subscription/downgrade-preview?newTierId=${newTierId}`,
      });
    }
  } catch (error) {
    console.error("Change tier error:", error);
    res.status(500).json({ error: "Failed to change tier" });
  }
};

export default {
  getAvailableTiers,
  getCurrentSubscription,
  selectTier,
  getUpgradePreviewEndpoint,
  upgradeSubscription,
  getDowngradePreviewEndpoint,
  downgradeSubscription,
  getOverLimitListingsEndpoint,
  selectListingsToKeepEndpoint,
  getArchivedListingsEndpoint,
  restoreListingEndpoint,
  changeTier,
  cancelSubscription,
  checkTierLimits,
  getSubscriptionHistory,
};