import { prisma } from "../config/prisma.js";

// Common include object for all queries
const listingInclude = {
  images: {
    where: { isCover: true },
    take: 1
  },
  host: {
    select: {
      id: true,
      name: true,
      profilePhoto: true
    }
  },
  _count: {
    select: {
      reviews: true,
      bookings: true
    }
  }
};

/**
 * Get Featured Listings
 */
export const getFeaturedListings = async (limit = 6) => {
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      isFeatured: true,
      OR: [
        { featuredUntil: null },
        { featuredUntil: { gte: now } }
      ]
    },
    take: limit,
    orderBy: [
      { featuredPriority: "desc" },
      { createdAt: "desc" }
    ],
    include: listingInclude
  });

  return listings.map(formatListingResponse);
};

/**
 * Get Discounted Listings
 */
export const getDiscountedListings = async (limit = 6) => {
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      discountPercent: { gt: 0 },
      OR: [
        { discountUntil: null },
        { discountUntil: { gte: now } }
      ]
    },
    take: limit,
    orderBy: [
      { discountPercent: "desc" },
      { createdAt: "desc" }
    ],
    include: listingInclude
  });

  return listings.map(formatListingResponse);
};

/**
 * Get Trending Listings
 */
export const getTrendingListings = async (limit = 6) => {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE"
    },
    take: limit,
    orderBy: [
      { bookingCount: "desc" },
      { viewCount: "desc" },
      { createdAt: "desc" }
    ],
    include: listingInclude
  });

  return listings.map(formatListingResponse);
};

/**
 * Get New Listings
 */
export const getNewListings = async (limit = 6) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gte: thirtyDaysAgo }
    },
    take: limit,
    orderBy: {
      createdAt: "desc"
    },
    include: listingInclude
  });

  return listings.map(formatListingResponse);
};

/**
 * Get All Homepage Sections in One Call
 */
export const getHomepageSections = async () => {
  const [featured, discounted, trending, newListings] = await Promise.all([
    getFeaturedListings(6),
    getDiscountedListings(6),
    getTrendingListings(6),
    getNewListings(6)
  ]);

  return {
    featured,
    discounted,
    trending,
    new: newListings
  };
};

/**
 * Increment View Count
 */
export const incrementViewCount = async (listingId) => {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      viewCount: { increment: 1 }
    }
  });
};

/**
 * Increment Booking Count
 */
export const incrementBookingCount = async (listingId) => {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      bookingCount: { increment: 1 }
    }
  });
};

/**
 * Format Listing Response with amenities
 */
const formatListingResponse = (listing) => {
  const originalPrice = Number(listing.hourlyRate || 0);
  const discountPercent = listing.discountPercent || 0;
  const discountedPrice = discountPercent > 0 
    ? originalPrice * (1 - discountPercent / 100)
    : originalPrice;

  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    
    // Pricing
    originalPrice,
    discountPercent,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    discountReason: listing.discountReason,
    hasDiscount: discountPercent > 0,
    
    // Status flags
    isFeatured: listing.isFeatured,
    isPromoted: listing.isPromoted,
    isNew: isNewListing(listing.createdAt),
    
    // Media
    coverImage: listing.images?.[0]?.url || null,
    
    // Host
    host: listing.host,
    
    // Stats
    reviewCount: listing._count?.reviews || 0,
    bookingCount: listing._count?.bookings || listing.bookingCount || 0,
    viewCount: listing.viewCount || 0,
    
    // Capacity & Amenities
    capacity: listing.capacity,
    amenities: listing.amenities || [],
    
    // Dates
    createdAt: listing.createdAt,
    featuredUntil: listing.featuredUntil,
    discountUntil: listing.discountUntil
  };
};

/**
 * Check if listing is new (created within last 7 days)
 */
const isNewListing = (createdAt) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(createdAt) > sevenDaysAgo;
};

/**
 * Admin: Set Featured Status
 */
export const setFeaturedStatus = async ({ listingId, isFeatured, priority = 0, durationDays = null, adminId }) => {
  const featuredUntil = durationDays 
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      isFeatured,
      featuredPriority: priority,
      featuredUntil
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId,
      action: isFeatured ? "LISTING_FEATURED" : "LISTING_UNFEATURED",
      entity: "Listing",
      entityId: listingId,
      after: { isFeatured, priority, featuredUntil }
    }
  });

  return listing;
};

/**
 * Host: Set Discount
 */
export const setDiscount = async ({ listingId, hostId, discountPercent, discountReason, durationDays = null }) => {
  // Verify host owns the listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { hostId: true }
  });

  if (!listing || listing.hostId !== hostId) {
    throw new Error("Unauthorized: You don't own this listing");
  }

  // Validate discount percent
  if (discountPercent < 0 || discountPercent > 90) {
    throw new Error("Discount must be between 0 and 90 percent");
  }

  const discountUntil = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      discountPercent,
      discountReason,
      discountUntil
    }
  });
};

/**
 * Remove Expired Featured/Discounts (Cron job)
 */
export const cleanupExpiredPromotions = async () => {
  const now = new Date();

  await prisma.listing.updateMany({
    where: {
      isFeatured: true,
      featuredUntil: { lt: now }
    },
    data: {
      isFeatured: false,
      featuredPriority: 0
    }
  });

  await prisma.listing.updateMany({
    where: {
      discountPercent: { gt: 0 },
      discountUntil: { lt: now }
    },
    data: {
      discountPercent: 0,
      discountReason: null
    }
  });

  console.log("Cleaned up expired promotions at", now.toISOString());
};