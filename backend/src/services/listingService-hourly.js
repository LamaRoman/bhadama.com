import { prisma } from "../config/prisma.js";

/**
 * Create a new listing
 */
export async function createListing(hostId, listingData) {
  const {
    title,
    description,
    location,
    hourlyRate,
    halfDayRate,
    fullDayRate,
    minHours,
    maxHours,
    capacity,
    amenities,
    operatingHours,
    status,
  } = listingData;

  return prisma.listing.create({
    data: {
      hostId,
      title,
      description,
      location,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      halfDayRate: halfDayRate ? parseFloat(halfDayRate) : null,
      fullDayRate: fullDayRate ? parseFloat(fullDayRate) : null,
      price: fullDayRate || halfDayRate || hourlyRate, // For backward compatibility
      minHours: minHours ? parseInt(minHours) : 2,
      maxHours: maxHours ? parseInt(maxHours) : 12,
      capacity: capacity ? parseInt(capacity) : null,
      amenities: amenities || [],
      operatingHours: operatingHours || {},
      status: status || "ACTIVE",
    },
  });
}

/**
 * Get listing by ID with all details
 */
export async function getListingById(listingId) {
  return prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: {
        orderBy: { isCover: "desc" },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "PENDING"] },
          bookingDate: {
            gte: new Date(),
          },
        },
        select: {
          bookingDate: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });
}

/**
 * Get host's listings
 */
export async function getHostListings(hostId) {
  return prisma.listing.findMany({
    where: { hostId },
    include: {
      images: {
        where: { isCover: true },
        take: 1,
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update listing
 */
export async function updateListing(listingId, hostId, updateData) {
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { hostId: true },
  });

  if (!listing || listing.hostId !== hostId) {
    throw new Error("Unauthorized");
  }

  // Parse numeric fields
  if (updateData.hourlyRate) updateData.hourlyRate = parseFloat(updateData.hourlyRate);
  if (updateData.halfDayRate) updateData.halfDayRate = parseFloat(updateData.halfDayRate);
  if (updateData.fullDayRate) updateData.fullDayRate = parseFloat(updateData.fullDayRate);
  if (updateData.minHours) updateData.minHours = parseInt(updateData.minHours);
  if (updateData.maxHours) updateData.maxHours = parseInt(updateData.maxHours);
  if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity);

  return prisma.listing.update({
    where: { id: listingId },
    data: updateData,
  });
}

/**
 * Delete listing
 */
export async function deleteListing(listingId, hostId) {
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { hostId: true },
  });

  if (!listing || listing.hostId !== hostId) {
    throw new Error("Unauthorized");
  }

  return prisma.listing.delete({
    where: { id: listingId },
  });
}

/**
 * Search listings with filters
 */
export async function searchListings(filters = {}) {
  const { location, amenities, minPrice, maxPrice, capacity, date } = filters;

  const where = {
    status: "ACTIVE",
  };

  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (amenities && amenities.length > 0) {
    where.amenities = {
      hasEvery: amenities,
    };
  }

  if (capacity) {
    where.capacity = {
      gte: parseInt(capacity),
    };
  }

  // Price filter (check any of the rates)
  if (minPrice || maxPrice) {
    where.OR = [];
    
    if (minPrice) {
      const min = parseFloat(minPrice);
      where.OR.push(
        { hourlyRate: { gte: min } },
        { halfDayRate: { gte: min } },
        { fullDayRate: { gte: min } }
      );
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      where.OR.push(
        { hourlyRate: { lte: max } },
        { halfDayRate: { lte: max } },
        { fullDayRate: { lte: max } }
      );
    }
  }

  return prisma.listing.findMany({
    where,
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
    },
    orderBy: { createdAt: "desc" },
  });
}