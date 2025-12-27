import { prisma } from "../config/prisma.js";

/**
 * Get all public listings with filters and pagination
 * Supports partial matching for amenities
 */
export async function getPublicListings(filters = {}) {
  const { 
    location, 
    minPrice, 
    maxPrice, 
    search,
    amenities,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build base where clause
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
    where.hourlyRate = {};
    if (minPrice) where.hourlyRate.gte = parseFloat(minPrice);
    if (maxPrice) where.hourlyRate.lte = parseFloat(maxPrice);
  }

  // Filter by specific amenities (exact match)
  if (amenities && amenities.length > 0) {
    where.amenities = {
      hasSome: Array.isArray(amenities) ? amenities : [amenities]
    };
  }

  // Determine sort order
  let orderBy = {};
  switch (sortBy) {
    case "price_low":
      orderBy = { hourlyRate: "asc" };
      break;
    case "price_high":
      orderBy = { hourlyRate: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  // If search query exists, do partial matching including amenities
  if (search) {
    const normalizedSearch = search.trim();

    // Get text matches from DB
    const textWhere = {
      ...where,
      OR: [
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } },
        { location: { contains: normalizedSearch, mode: "insensitive" } },
      ],
    };

    const textMatches = await prisma.listing.findMany({
      where: textWhere,
      include: {
        images: true,
        host: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: { reviews: true, bookings: true }
        }
      },
    });

    // Get all listings for amenity partial matching
    const allListings = await prisma.listing.findMany({
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
        _count: {
          select: { reviews: true, bookings: true }
        }
      },
    });

    // Filter for partial amenity matches
    const amenityMatches = allListings.filter(listing => {
      if (!listing.amenities || listing.amenities.length === 0) return false;
      return listing.amenities.some(amenity => 
        amenity.toLowerCase().includes(normalizedSearch.toLowerCase())
      );
    });

    // Combine and deduplicate
    const combinedMap = new Map();
    textMatches.forEach(listing => combinedMap.set(listing.id, listing));
    amenityMatches.forEach(listing => combinedMap.set(listing.id, listing));
    
    let allResults = Array.from(combinedMap.values());

    // Sort
    if (sortBy === "price_low") {
      allResults.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sortBy === "price_high") {
      allResults.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    } else {
      allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Paginate
    const total = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + take);

    return {
      listings: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + paginatedResults.length < total
      }
    };
  }

  // No search - use standard DB query
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
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
        _count: {
          select: { reviews: true, bookings: true }
        }
      },
      orderBy,
      skip,
      take,
    }),
    prisma.listing.count({ where })
  ]);

  return {
    listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + listings.length < total
    }
  };
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
export async function getListingsByLocation(location, limit = 20) {
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
    take: limit,
  });
}

/**
 * Search listings with pagination - includes partial amenity matching
 */
export async function searchListings(query, options = {}) {
  const { page = 1, limit = 20 } = options;
  
  const normalizedQuery = query.trim();
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // First, get all active listings that match text fields
  // Then filter for amenities in application code (for partial matching)
  const textMatchWhere = {
    status: "ACTIVE",
    OR: [
      { title: { contains: normalizedQuery, mode: "insensitive" } },
      { description: { contains: normalizedQuery, mode: "insensitive" } },
      { location: { contains: normalizedQuery, mode: "insensitive" } },
    ],
  };

  // Get text matches
  const textMatches = await prisma.listing.findMany({
    where: textMatchWhere,
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      _count: {
        select: { reviews: true, bookings: true }
      }
    },
  });

  // Get amenity matches (partial matching)
  // Find listings where ANY amenity CONTAINS the search query
  const allActiveListings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      images: true,
      host: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      _count: {
        select: { reviews: true, bookings: true }
      }
    },
  });

  // Filter for partial amenity matches
  const amenityMatches = allActiveListings.filter(listing => {
    if (!listing.amenities || listing.amenities.length === 0) return false;
    return listing.amenities.some(amenity => 
      amenity.toLowerCase().includes(normalizedQuery.toLowerCase())
    );
  });

  // Combine and deduplicate results
  const combinedMap = new Map();
  
  textMatches.forEach(listing => combinedMap.set(listing.id, listing));
  amenityMatches.forEach(listing => combinedMap.set(listing.id, listing));
  
  const allResults = Array.from(combinedMap.values());
  
  // Sort by createdAt desc
  allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Paginate
  const total = allResults.length;
  const paginatedResults = allResults.slice(skip, skip + take);

  return {
    listings: paginatedResults,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + paginatedResults.length < total
    },
    query: normalizedQuery
  };
}

/**
 * Get all unique amenities for filter options
 */
export async function getAllAmenities() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { amenities: true }
  });

  const amenitySet = new Set();
  listings.forEach(listing => {
    listing.amenities?.forEach(amenity => amenitySet.add(amenity));
  });

  return Array.from(amenitySet).sort();
}

// Helper function
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}