// ==========================================
// TIER CHANGE SERVICE
// ==========================================
// Handles upgrade and downgrade business logic
// ==========================================

import { PrismaClient } from "@prisma/client";
import {
  calculateUpgradeProration,
  calculateGracePeriodEnd,
  validateUpgrade,
  validateDowngrade,
  formatProrationForDisplay,
} from "../utils/prorationCalculator.js"
import { DOWNGRADE_RULES, GRACE_PERIOD } from "../config/tier.config.js";

const prisma = new PrismaClient();

// ==========================================
// UPGRADE PREVIEW
// ==========================================

/**
 * Get upgrade preview with proration calculation
 * @param {number} hostId 
 * @param {number} newTierId 
 * @param {string} billingCycle - Optional, defaults to current
 * @returns {Object} Proration preview
 */
export const getUpgradePreview = async (hostId, newTierId, billingCycle = null) => {
  // Get current subscription
  const currentSubscription = await prisma.hostSubscription.findFirst({
    where: {
      hostId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: {
      tier: {
        include: {
          pricing: { where: { isActive: true } },
        },
      },
    },
  });

  if (!currentSubscription) {
    throw new Error("No active subscription found");
  }

  // Get new tier with pricing
  const cycle = billingCycle || currentSubscription.billingCycle || "MONTHLY";
  const currency = currentSubscription.currency || "NPR";

  const newTier = await prisma.hostTier.findUnique({
    where: { id: parseInt(newTierId) },
    include: {
      pricing: {
        where: {
          billingCycle: cycle,
          currency,
          isActive: true,
        },
      },
    },
  });

  if (!newTier || !newTier.isActive) {
    throw new Error("Tier not found or inactive");
  }

  // Validate upgrade
  const validation = validateUpgrade(currentSubscription.tier, newTier);
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  // Get pricing
  const currentPricing = currentSubscription.tier.pricing.find(
    (p) => p.billingCycle === cycle && p.currency === currency
  );
  const newPricing = newTier.pricing[0];

  if (!newPricing) {
    throw new Error("No pricing available for selected tier and billing cycle");
  }

  const currentPrice = currentPricing?.finalPrice || 0;
  const newPrice = newPricing.finalPrice;

  // Calculate proration
  const proration = calculateUpgradeProration({
    currentSubscription,
    currentPrice,
    newPrice,
    billingCycle: cycle,
  });

  return {
    currentTier: {
      id: currentSubscription.tier.id,
      name: currentSubscription.tier.name,
      displayName: currentSubscription.tier.displayName,
      price: currentPrice,
    },
    newTier: {
      id: newTier.id,
      name: newTier.name,
      displayName: newTier.displayName,
      price: newPrice,
      features: newTier.features,
      maxListings: newTier.maxListings,
    },
    billingCycle: cycle,
    currency,
    proration: formatProrationForDisplay(proration, currency),
    rawProration: proration,
    subscriptionEndDate: currentSubscription.endDate,
  };
};

// ==========================================
// EXECUTE UPGRADE
// ==========================================

/**
 * Execute tier upgrade with proration
 * @param {number} hostId 
 * @param {number} newTierId 
 * @param {string} billingCycle 
 * @returns {Object} Payment details or success message
 */
export const executeUpgrade = async (hostId, newTierId, billingCycle = null) => {
  // Get upgrade preview (includes validation)
  const preview = await getUpgradePreview(hostId, newTierId, billingCycle);

  const currentSubscription = await prisma.hostSubscription.findFirst({
    where: {
      hostId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
  });

  // If upgrading to FREE (shouldn't happen, but handle it)
  if (preview.newTier.name === "FREE") {
    throw new Error("Cannot upgrade to FREE tier. Use downgrade instead.");
  }

  // Create prorated payment
  const payment = await prisma.payment.create({
    data: {
      hostId,
      subscriptionId: currentSubscription.id,
      amount: preview.rawProration.amountDue,
      originalAmount: preview.newTier.price,
      proratedCredit: preview.rawProration.unusedCredit,
      currency: preview.currency,
      gateway: "PENDING", // Will be updated when user selects payment method
      status: "PENDING",
      type: "PRORATED",
      upgradeFromTierId: preview.currentTier.id,
      description: `Upgrade to ${preview.newTier.displayName} (Prorated)`,
      periodStart: new Date(),
      periodEnd: preview.subscriptionEndDate,
      metadata: {
        proration: preview.rawProration,
        fromTier: preview.currentTier.name,
        toTier: preview.newTier.name,
      },
    },
  });

  // Store pending upgrade info
  await prisma.hostSubscription.update({
    where: { id: currentSubscription.id },
    data: {
      pendingTierId: preview.newTier.id,
    },
  });

  return {
    requiresPayment: preview.rawProration.amountDue > 0,
    payment: {
      id: payment.id,
      amount: payment.amount,
      originalAmount: payment.originalAmount,
      proratedCredit: payment.proratedCredit,
      currency: payment.currency,
    },
    preview,
    message: preview.rawProration.amountDue > 0
      ? `Pay ${preview.currency === "USD" ? "$" : "Rs."}${preview.rawProration.amountDue} to upgrade`
      : "Upgrade will be applied with credit from your current plan",
  };
};

/**
 * Complete upgrade after payment
 * Called by payment webhook/callback
 * @param {number} paymentId 
 * @returns {Object} Updated subscription
 */
export const completeUpgrade = async (paymentId) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(paymentId) },
    include: {
      subscription: {
        include: { tier: true },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "COMPLETED") {
    throw new Error("Payment not completed");
  }

  if (payment.type !== "PRORATED") {
    throw new Error("Not an upgrade payment");
  }

  const subscription = payment.subscription;
  const newTierId = subscription.pendingTierId;

  if (!newTierId) {
    throw new Error("No pending tier upgrade found");
  }

  const newTier = await prisma.hostTier.findUnique({
    where: { id: newTierId },
  });

  // Update subscription
  const updatedSubscription = await prisma.hostSubscription.update({
    where: { id: subscription.id },
    data: {
      previousTierId: subscription.tierId,
      tierId: newTierId,
      pendingTierId: null,
      status: "ACTIVE",
    },
  });

  // Update user's current tier
  await prisma.user.update({
    where: { id: subscription.hostId },
    data: {
      currentTier: newTier.name,
    },
  });

  // Log history
  await prisma.subscriptionHistory.create({
    data: {
      subscriptionId: subscription.id,
      action: "upgraded",
      fromTier: subscription.tier.name,
      toTier: newTier.name,
      details: {
        paymentId,
        proratedAmount: payment.amount,
        creditApplied: payment.proratedCredit,
      },
      changedByType: "host",
    },
  });

  return {
    subscription: updatedSubscription,
    newTier,
    message: `Successfully upgraded to ${newTier.displayName}`,
  };
};

// ==========================================
// DOWNGRADE PREVIEW
// ==========================================

/**
 * Get downgrade preview with listing impact
 * @param {number} hostId 
 * @param {number} newTierId 
 * @returns {Object} Downgrade preview
 */
export const getDowngradePreview = async (hostId, newTierId) => {
  // Get current subscription
  const currentSubscription = await prisma.hostSubscription.findFirst({
    where: {
      hostId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: {
      tier: true,
    },
  });

  if (!currentSubscription) {
    throw new Error("No active subscription found");
  }

  // Get new tier
  const newTier = await prisma.hostTier.findUnique({
    where: { id: parseInt(newTierId) },
  });

  if (!newTier || !newTier.isActive) {
    throw new Error("Tier not found or inactive");
  }

  // Get current listing count
  const listingCount = await prisma.listing.count({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
    },
  });

  // Validate downgrade
  const validation = validateDowngrade(
    currentSubscription.tier,
    newTier,
    listingCount
  );

  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  // Get affected listings if there are excess
  let affectedListings = [];
  if (validation.excessListings > 0) {
    affectedListings = await prisma.listing.findMany({
      where: {
        hostId,
        status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
      },
      orderBy: { createdAt: "asc" }, // Oldest first (will be archived if not selected)
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        bookingCount: true,
        viewCount: true,
        images: {
          where: { isCover: true },
          take: 1,
          select: { url: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });
  }

  // Calculate average rating for each listing
  const listingsWithRating = affectedListings.map((listing) => ({
    ...listing,
    coverImage: listing.images[0]?.url || null,
    averageRating: listing.reviews.length > 0
      ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
      : null,
    reviewCount: listing.reviews.length,
  }));

  const gracePeriodEnd = calculateGracePeriodEnd(new Date(), DOWNGRADE_RULES.GRACE_DAYS);

  return {
    currentTier: {
      id: currentSubscription.tier.id,
      name: currentSubscription.tier.name,
      displayName: currentSubscription.tier.displayName,
      maxListings: currentSubscription.tier.maxListings,
    },
    newTier: {
      id: newTier.id,
      name: newTier.name,
      displayName: newTier.displayName,
      maxListings: newTier.maxListings,
      commissionPercent: newTier.commissionPercent,
    },
    listingImpact: {
      currentCount: listingCount,
      newLimit: newTier.maxListings === -1 ? "Unlimited" : newTier.maxListings,
      excessCount: validation.excessListings,
      requiresSelection: validation.requiresListingSelection,
    },
    affectedListings: listingsWithRating,
    gracePeriod: {
      days: DOWNGRADE_RULES.GRACE_DAYS,
      endsAt: gracePeriodEnd,
      autoArchiveOldest: DOWNGRADE_RULES.AUTO_DEACTIVATE,
    },
    warnings: validation.excessListings > 0
      ? [
          `You have ${listingCount} listings but ${newTier.displayName} allows only ${newTier.maxListings}.`,
          `${validation.excessListings} listing(s) will become read-only.`,
          `You have ${DOWNGRADE_RULES.GRACE_DAYS} days to choose which listings to keep.`,
        ]
      : [],
  };
};

// ==========================================
// EXECUTE DOWNGRADE
// ==========================================

/**
 * Execute tier downgrade with grace period
 * @param {number} hostId 
 * @param {number} newTierId 
 * @returns {Object} Downgrade result
 */
export const executeDowngrade = async (hostId, newTierId) => {
  // Get downgrade preview (includes validation)
  const preview = await getDowngradePreview(hostId, newTierId);

  const currentSubscription = await prisma.hostSubscription.findFirst({
    where: {
      hostId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
  });

  const gracePeriodEnd = calculateGracePeriodEnd(
    new Date(),
    DOWNGRADE_RULES.GRACE_DAYS
  );

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update subscription
    const updatedSubscription = await tx.hostSubscription.update({
      where: { id: currentSubscription.id },
      data: {
        previousTierId: currentSubscription.tierId,
        tierId: preview.newTier.id,
        gracePeriodEnd: preview.listingImpact.excessCount > 0 ? gracePeriodEnd : null,
        listingSelectionDeadline: preview.listingImpact.excessCount > 0 ? gracePeriodEnd : null,
        excessListingsCount: preview.listingImpact.excessCount,
        autoRenew: preview.newTier.name === "FREE" ? false : currentSubscription.autoRenew,
        billingCycle: preview.newTier.name === "FREE" ? null : currentSubscription.billingCycle,
        endDate: preview.newTier.name === "FREE" ? null : currentSubscription.endDate,
      },
    });

    // Update user's current tier
    await tx.user.update({
      where: { id: hostId },
      data: {
        currentTier: preview.newTier.name,
        tierExpiresAt: preview.newTier.name === "FREE" ? null : currentSubscription.endDate,
      },
    });

    // Mark excess listings as OVER_LIMIT (oldest first)
    if (preview.listingImpact.excessCount > 0) {
      const listingsToMark = preview.affectedListings
        .slice(0, preview.listingImpact.excessCount)
        .map((l) => l.id);

      await tx.listing.updateMany({
        where: {
          id: { in: listingsToMark },
        },
        data: {
          status: "OVER_LIMIT",
        },
      });
    }

    // Log history
    await tx.subscriptionHistory.create({
      data: {
        subscriptionId: currentSubscription.id,
        action: "downgraded",
        fromTier: preview.currentTier.name,
        toTier: preview.newTier.name,
        details: {
          excessListings: preview.listingImpact.excessCount,
          gracePeriodEnd: gracePeriodEnd,
        },
        changedByType: "host",
      },
    });

    return updatedSubscription;
  });

  // TODO: Send email notification about downgrade and grace period

  return {
    success: true,
    subscription: result,
    newTier: preview.newTier,
    listingImpact: preview.listingImpact,
    gracePeriod: preview.listingImpact.excessCount > 0
      ? {
          endsAt: gracePeriodEnd,
          days: DOWNGRADE_RULES.GRACE_DAYS,
          listingsAffected: preview.listingImpact.excessCount,
        }
      : null,
    message: preview.listingImpact.excessCount > 0
      ? `Downgraded to ${preview.newTier.displayName}. You have ${DOWNGRADE_RULES.GRACE_DAYS} days to select which ${preview.newTier.maxListings} listings to keep.`
      : `Successfully downgraded to ${preview.newTier.displayName}`,
  };
};

// ==========================================
// LISTING SELECTION
// ==========================================

/**
 * Get listings that are over the tier limit
 * @param {number} hostId 
 * @returns {Object} Over-limit listings and selection info
 */
export const getOverLimitListings = async (hostId) => {
  const subscription = await prisma.hostSubscription.findFirst({
    where: { hostId },
    include: { tier: true },
  });

  if (!subscription) {
    throw new Error("No subscription found");
  }

  const limit = subscription.tier.maxListings;
  const allListings = await prisma.listing.findMany({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING", "OVER_LIMIT"] },
    },
    orderBy: { createdAt: "desc" }, // Newest first for selection
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      bookingCount: true,
      viewCount: true,
      images: {
        where: { isCover: true },
        take: 1,
        select: { url: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  // Add computed fields
  const listingsWithDetails = allListings.map((listing) => ({
    ...listing,
    coverImage: listing.images[0]?.url || null,
    averageRating: listing.reviews.length > 0
      ? Math.round(
          (listing.reviews.reduce((sum, r) => sum + r.rating, 0) /
            listing.reviews.length) *
            10
        ) / 10
      : null,
    reviewCount: listing.reviews.length,
    isOverLimit: listing.status === "OVER_LIMIT",
  }));

  return {
    listings: listingsWithDetails,
    limit: limit === -1 ? "Unlimited" : limit,
    currentCount: allListings.length,
    excessCount: subscription.excessListingsCount || 0,
    selectionDeadline: subscription.listingSelectionDeadline,
    gracePeriodActive: subscription.listingSelectionDeadline
      ? new Date() < new Date(subscription.listingSelectionDeadline)
      : false,
  };
};

/**
 * Select which listings to keep active
 * @param {number} hostId 
 * @param {number[]} listingIdsToKeep 
 * @returns {Object} Result
 */
export const selectListingsToKeep = async (hostId, listingIdsToKeep) => {
  const subscription = await prisma.hostSubscription.findFirst({
    where: { hostId },
    include: { tier: true },
  });

  if (!subscription) {
    throw new Error("No subscription found");
  }

  const limit = subscription.tier.maxListings;

  if (limit !== -1 && listingIdsToKeep.length > limit) {
    throw new Error(`You can only keep ${limit} listings active`);
  }

  // Get all non-archived listings
  const allListings = await prisma.listing.findMany({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING", "OVER_LIMIT"] },
    },
    select: { id: true, status: true },
  });

  const listingIdsToArchive = allListings
    .filter((l) => !listingIdsToKeep.includes(l.id))
    .map((l) => l.id);

  // Transaction to update listings
  await prisma.$transaction(async (tx) => {
    // Keep selected listings active
    await tx.listing.updateMany({
      where: {
        id: { in: listingIdsToKeep },
        hostId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    // Archive the rest
    if (listingIdsToArchive.length > 0) {
      await tx.listing.updateMany({
        where: {
          id: { in: listingIdsToArchive },
          hostId,
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
          archivedReason: "tier_downgrade",
        },
      });
    }

    // Clear grace period
    await tx.hostSubscription.update({
      where: { id: subscription.id },
      data: {
        gracePeriodEnd: null,
        listingSelectionDeadline: null,
        excessListingsCount: 0,
      },
    });
  });

  return {
    success: true,
    keptActive: listingIdsToKeep.length,
    archived: listingIdsToArchive.length,
    message: `Kept ${listingIdsToKeep.length} listings active, archived ${listingIdsToArchive.length} listings`,
  };
};

export default {
  getUpgradePreview,
  executeUpgrade,
  completeUpgrade,
  getDowngradePreview,
  executeDowngrade,
  getOverLimitListings,
  selectListingsToKeep,
};