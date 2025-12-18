import { prisma } from "../config/prisma.js";

/**
 * Get all public listings with filters
 */
export async function getPublicListings(filters = {}) {
  const { location, minPrice, maxPrice, search } = filters;

  const where = {
    status: "ACTIVE",
  };

  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
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
 */
export async function getPublicListingById(listingId) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      status: "ACTIVE",
    },
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      // ✅ CLEAN - no availability model
    },
  });
}

/**
 * Get featured listings
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
          profilePhoto: true,
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
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Search listings
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
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}