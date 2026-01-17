// ==========================================
// LISTING ARCHIVE SERVICE
// ==========================================
// Handles listing archival and restoration
// ==========================================

import { PrismaClient } from "@prisma/client";
import { DOWNGRADE_RULES } from "../config/tier.config.js";

const prisma = new PrismaClient();

// ==========================================
// ARCHIVE EXCESS LISTINGS
// ==========================================

/**
 * Archive excess listings when grace period expires
 * Called by cron job or manually
 * @param {number} hostId 
 * @param {number} limit - Number of listings to keep
 * @returns {Object} Archive result
 */
export const archiveExcessListings = async (hostId, limit) => {
  // Get all non-archived listings, ordered by creation date (oldest first)
  const listings = await prisma.listing.findMany({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING", "OVER_LIMIT"] },
    },
    orderBy: { createdAt: "asc" }, // Oldest first - will be archived
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  if (listings.length <= limit) {
    return {
      archived: 0,
      kept: listings.length,
      message: "No excess listings to archive",
    };
  }

  // Archive oldest listings (keep newest)
  const listingsToArchive = listings.slice(0, listings.length - limit);
  const listingsToKeep = listings.slice(listings.length - limit);

  await prisma.$transaction(async (tx) => {
    // Archive excess listings
    await tx.listing.updateMany({
      where: {
        id: { in: listingsToArchive.map((l) => l.id) },
      },
      data: {
        previousStatus: undefined, // Will store current status
        status: "ARCHIVED",
        archivedAt: new Date(),
        archivedReason: "grace_expired",
      },
    });

    // Store previous status for each listing
    for (const listing of listingsToArchive) {
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          previousStatus: listing.status,
        },
      });
    }

    // Make sure kept listings are ACTIVE (not OVER_LIMIT)
    await tx.listing.updateMany({
      where: {
        id: { in: listingsToKeep.map((l) => l.id) },
        status: "OVER_LIMIT",
      },
      data: {
        status: "ACTIVE",
      },
    });
  });

  return {
    archived: listingsToArchive.length,
    kept: listingsToKeep.length,
    archivedListings: listingsToArchive.map((l) => ({
      id: l.id,
      title: l.title,
    })),
    message: `Archived ${listingsToArchive.length} oldest listings, kept ${listingsToKeep.length} newest`,
  };
};

// ==========================================
// RESTORE ARCHIVED LISTINGS
// ==========================================

/**
 * Restore archived listings when host upgrades
 * @param {number} hostId 
 * @param {number} newLimit - New listing limit (-1 for unlimited)
 * @returns {Object} Restoration result
 */
export const restoreListingsOnUpgrade = async (hostId, newLimit) => {
  // Get all archived listings that were archived due to tier changes
  const archivedListings = await prisma.listing.findMany({
    where: {
      hostId,
      status: "ARCHIVED",
      archivedReason: { in: ["tier_downgrade", "grace_expired"] },
    },
    orderBy: { archivedAt: "desc" }, // Most recently archived first
    select: {
      id: true,
      title: true,
      previousStatus: true,
      archivedAt: true,
    },
  });

  if (archivedListings.length === 0) {
    return {
      restored: 0,
      message: "No archived listings to restore",
    };
  }

  // Calculate how many can be restored
  const currentActiveCount = await prisma.listing.count({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
    },
  });

  let canRestore = archivedListings.length;
  if (newLimit !== -1) {
    const availableSlots = newLimit - currentActiveCount;
    canRestore = Math.min(archivedListings.length, availableSlots);
  }

  if (canRestore === 0) {
    return {
      restored: 0,
      remaining: archivedListings.length,
      message: "No available slots to restore listings",
    };
  }

  const listingsToRestore = archivedListings.slice(0, canRestore);

  // Restore listings
  await prisma.$transaction(async (tx) => {
    for (const listing of listingsToRestore) {
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          status: listing.previousStatus || "ACTIVE",
          archivedAt: null,
          archivedReason: null,
          previousStatus: null,
        },
      });
    }
  });

  return {
    restored: listingsToRestore.length,
    remaining: archivedListings.length - canRestore,
    restoredListings: listingsToRestore.map((l) => ({
      id: l.id,
      title: l.title,
    })),
    message: `Restored ${listingsToRestore.length} listings`,
  };
};

// ==========================================
// GET ARCHIVED LISTINGS
// ==========================================

/**
 * Get all archived listings for a host
 * @param {number} hostId 
 * @returns {Object} Archived listings
 */
export const getArchivedListings = async (hostId) => {
  const listings = await prisma.listing.findMany({
    where: {
      hostId,
      status: "ARCHIVED",
    },
    orderBy: { archivedAt: "desc" },
    select: {
      id: true,
      title: true,
      archivedAt: true,
      archivedReason: true,
      previousStatus: true,
      location: true,
      images: {
        where: { isCover: true },
        take: 1,
        select: { url: true },
      },
      bookingCount: true,
      viewCount: true,
    },
  });

  return {
    listings: listings.map((l) => ({
      ...l,
      coverImage: l.images[0]?.url || null,
      canRestore: true, // Will be checked against limits on restore
    })),
    count: listings.length,
  };
};

// ==========================================
// MANUALLY ARCHIVE/RESTORE SINGLE LISTING
// ==========================================

/**
 * Manually archive a listing
 * @param {number} hostId 
 * @param {number} listingId 
 * @returns {Object} Result
 */
export const archiveListing = async (hostId, listingId) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id: parseInt(listingId),
      hostId,
      status: { not: "ARCHIVED" },
    },
  });

  if (!listing) {
    throw new Error("Listing not found or already archived");
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      previousStatus: listing.status,
      status: "ARCHIVED",
      archivedAt: new Date(),
      archivedReason: "manual",
    },
  });

  return {
    success: true,
    message: "Listing archived successfully",
  };
};

/**
 * Manually restore an archived listing
 * @param {number} hostId 
 * @param {number} listingId 
 * @returns {Object} Result
 */
export const restoreListing = async (hostId, listingId) => {
  // Check if host has capacity
  const user = await prisma.user.findUnique({
    where: { id: hostId },
    select: { currentTier: true },
  });

  const tier = await prisma.hostTier.findUnique({
    where: { name: user.currentTier || "FREE" },
  });

  const currentCount = await prisma.listing.count({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING", "OVER_LIMIT"] },
    },
  });

  if (tier.maxListings !== -1 && currentCount >= tier.maxListings) {
    throw new Error(
      `Cannot restore: You're at your listing limit (${tier.maxListings}). Upgrade your plan or archive another listing.`
    );
  }

  const listing = await prisma.listing.findFirst({
    where: {
      id: parseInt(listingId),
      hostId,
      status: "ARCHIVED",
    },
  });

  if (!listing) {
    throw new Error("Archived listing not found");
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: listing.previousStatus || "ACTIVE",
      archivedAt: null,
      archivedReason: null,
      previousStatus: null,
    },
  });

  return {
    success: true,
    message: "Listing restored successfully",
  };
};

// ==========================================
// MARK LISTINGS AS OVER_LIMIT
// ==========================================

/**
 * Mark excess listings as OVER_LIMIT (read-only)
 * Called when downgrade starts
 * @param {number} hostId 
 * @param {number} limit - New tier limit
 * @returns {Object} Result
 */
export const markExcessListingsAsOverLimit = async (hostId, limit) => {
  const listings = await prisma.listing.findMany({
    where: {
      hostId,
      status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
    },
    orderBy: { createdAt: "asc" }, // Oldest first
    select: { id: true },
  });

  if (listings.length <= limit) {
    return {
      marked: 0,
      message: "No excess listings",
    };
  }

  const excessListings = listings.slice(0, listings.length - limit);

  await prisma.listing.updateMany({
    where: {
      id: { in: excessListings.map((l) => l.id) },
    },
    data: {
      status: "OVER_LIMIT",
    },
  });

  return {
    marked: excessListings.length,
    message: `Marked ${excessListings.length} listings as over-limit`,
  };
};

// ==========================================
// CLEAR OVER_LIMIT STATUS
// ==========================================

/**
 * Clear OVER_LIMIT status when host selects listings or upgrades
 * @param {number} hostId 
 * @returns {Object} Result
 */
export const clearOverLimitStatus = async (hostId) => {
  const result = await prisma.listing.updateMany({
    where: {
      hostId,
      status: "OVER_LIMIT",
    },
    data: {
      status: "ACTIVE",
    },
  });

  return {
    updated: result.count,
    message: `Cleared over-limit status for ${result.count} listings`,
  };
};

export default {
  archiveExcessListings,
  restoreListingsOnUpgrade,
  getArchivedListings,
  archiveListing,
  restoreListing,
  markExcessListingsAsOverLimit,
  clearOverLimitStatus,
};