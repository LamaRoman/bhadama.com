import { prisma } from "../config/prisma.config.js";

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

  // Common select object to ensure durationDiscounts is always included
  const selectFields = {
    id: true,
    title: true,
    description: true,
    location: true,
    hourlyRate: true,
    discountPercent: true,
    discountReason: true,
    discountFrom: true,
    discountUntil: true,
    isFeatured: true,
    featuredUntil: true,
    capacity: true,
    amenities: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    bookingCount: true,
    viewCount: true,
    // ✅ CRITICAL: Include these JSON fields
    durationDiscounts: true,
    bonusHoursOffer: true,
    images: {
      select: {
        id: true,
        url: true,
        isCover: true,
        order: true,
      }
    },
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
  };

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
      select: selectFields,
    });

    // Get all listings for amenity partial matching
    const allListings = await prisma.listing.findMany({
      where,
      select: selectFields,
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
      select: selectFields,
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
 * Get a single public listing by ID with all pricing fields
 */
export async function getPublicListingById(listingId) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      hostId: true,
      title: true,
      slug: true,
      description: true,
      location: true,
      address: true,
      latitude: true,
      longitude: true,
      
      // ✅ All Pricing Fields
      hourlyRate: true,
      durationDiscounts: true,  // ✅ ADDED
      bonusHoursOffer: true,
      
      minHours: true,
      maxHours: true,
      includedGuests: true,
      extraGuestCharge: true,
      
      // Booking Settings
      autoConfirm: true,
      minAdvanceBooking: true,
      maxAdvanceBooking: true,
      instantBooking: true,
      
      // Details
      operatingHours: true,
      amenities: true,
      capacity: true,
      minCapacity: true,
      size: true,
      rules: true,
      
      // Status
      status: true,
      featured: true,
      isFeatured: true,
      
      // Discount (general listing discount)
      discountPercent: true,
      discountFrom: true,
      discountUntil: true,
      discountReason: true,
      
      // Timestamps
      createdAt: true,
      updatedAt: true,
      
      // Relations
      images: {
        orderBy: { isCover: 'desc' }
      },
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
    select: {
      id: true,
      title: true,
      location: true,
      hourlyRate: true,
      discountPercent: true,
      isFeatured: true,
      capacity: true,
      amenities: true,
      createdAt: true,
      durationDiscounts: true,  // ✅ ADDED
      bonusHoursOffer: true,     // ✅ ADDED
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
    select: {
      id: true,
      title: true,
      location: true,
      hourlyRate: true,
      discountPercent: true,
      isFeatured: true,
      capacity: true,
      amenities: true,
      createdAt: true,
      durationDiscounts: true,  // ✅ ADDED
      bonusHoursOffer: true,     // ✅ ADDED
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

  const selectFields = {
    id: true,
    title: true,
    description: true,
    location: true,
    hourlyRate: true,
    discountPercent: true,
    isFeatured: true,
    capacity: true,
    amenities: true,
    createdAt: true,
    durationDiscounts: true,  // ✅ ADDED
    bonusHoursOffer: true,     // ✅ ADDED
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
  };

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
    select: selectFields,
  });

  // Get amenity matches (partial matching)
  const allActiveListings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: selectFields,
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