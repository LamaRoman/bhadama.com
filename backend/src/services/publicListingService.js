import { prisma } from "../config/prisma.js";


/**
 * Get all public listings with filters
 * @param {Object} filters - Optional filters (location, minPrice, maxPrice, search)
 * @returns {Promise<Array>} - Array of listings
 */
export async function getPublicListings(filters = {}) {
  const { location, minPrice, maxPrice, search } = filters;

  const where = {
    status: "ACTIVE", // Only show active listings
  };

  // Location filter
  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  // Combine price & search filters
  const orFilters = [];

  // Price filters
  if (minPrice || maxPrice) {
    if (minPrice) {
      const min = parseFloat(minPrice);
      orFilters.push(
        { hourlyRate: { gte: min } },
        { halfDayRate: { gte: min } },
        { fullDayRate: { gte: min } }
      );
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      orFilters.push(
        { hourlyRate: { lte: max } },
        { halfDayRate: { lte: max } },
        { fullDayRate: { lte: max } }
      );
    }
  }

  // Search filter (title or description)
  if (search) {
    orFilters.push(
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    );
  }

  if (orFilters.length) {
    where.OR = orFilters;
  }

  return prisma.listing.findMany({
    where,
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}


/**
 * Get a single public listing by ID
 * @param {number} listingId - The listing ID
 * @returns {Promise<Object|null>} - Listing or null
 */
export async function getPublicListingById(listingId) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      status: "ACTIVE", // Only show if active
    },
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,  // ← ADDED
        },
      },
      availability: {
        orderBy: { date: "asc" },
      },
    },
  });
}

/**
 * Get featured listings (e.g., top rated, most booked)
 * @param {number} limit - Number of listings to return
 * @returns {Promise<Array>} - Array of featured listings
 */
export async function getFeaturedListings(limit = 6) {
  return prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      images: {
        where: { isCover: true },
        take: 1,
      },
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,  // ← ADDED
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: {
      bookings: { _count: "desc" },
    },
    take: limit,
  });
}

/**
 * Get listings by location
 * @param {string} location - Location to search
 * @returns {Promise<Array>} - Array of listings
 */
export async function getListingsByLocation(location) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      location: {
        contains: location,
        mode: "insensitive",
      },
    },
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,  // ← ADDED
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Search listings
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching listings
 */
export async function searchListings(query) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,  // ← ADDED
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}