import { prisma } from "../config/prisma.js";

/**
 * Create a new listing
 * @param {number} hostId - The host's user ID
 * @param {Object} data - Listing data
 * @returns {Promise<Object>} - Created listing
 */
export async function createListing(hostId, data) {
  console.log("creating listing with data",data)// debug here
  const { title, description, price, location, status } = data;

  // dont pass status from frontend, set it explicitly
  return prisma.listing.create({
    data: {
      title,
      description,
      price: parseFloat(price),
      location,
      status: status || "ACTIVE", // hardcore enum value, don't use data.status
      hostId,
    },
  });
}

/**
 * Get all listings for a specific host
 * @param {number} hostId - The host's user ID
 * @returns {Promise<Array>} - Array of listings with images
 */
export async function getListingsByHostId(hostId) {
  return prisma.listing.findMany({
    where: { hostId },
    include: {
      images: true,
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a specific listing by ID (with host ownership check)
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID
 * @returns {Promise<Object|null>} - Listing or null
 */
export async function getListingByIdForHost(listingId, hostId) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      hostId,
    },
    include: {
      images: true,
      availability: {
        orderBy: { date: "asc" },
      },
      bookings: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });
}

/**
 * Update a listing
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID (for authorization)
 * @param {Object} data - Updated listing data
 * @returns {Promise<Object>} - Updated listing
 */
export async function updateListing(listingId, hostId, data) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  const { title, description, price, location, status } = data;

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(location && { location }),
      ...(status && { status }),
    },
    include: {
      images: true,
    },
  });
}

/**
 * Delete a listing
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID (for authorization)
 * @returns {Promise<Object>} - Result with message
 */
export async function deleteListing(listingId, hostId) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  // Delete in transaction to handle related records
  await prisma.$transaction(async (tx) => {
    // Delete related images
    await tx.listingImage.deleteMany({
      where: { listingId },
    });

    // Delete related availability
    await tx.availability.deleteMany({
      where: { listingId },
    });

    // Delete related bookings
    await tx.booking.deleteMany({
      where: { listingId },
    });

    // Delete the listing
    await tx.listing.delete({
      where: { id: listingId },
    });
  });

  return { message: "Listing deleted successfully" };
}

/**
 * Add images to a listing
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID (for authorization)
 * @param {Array} imageUrls - Array of image URLs
 * @returns {Promise<Object>} - Updated listing with images
 */
export async function addImagesToListing(listingId, hostId, imageUrls) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
    include: { images: true },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  // Determine if first image should be cover
  const hasCover = listing.images.some((img) => img.isCover);

  const imageData = imageUrls.map((url, index) => ({
    listingId,
    url,
    isCover: !hasCover && index === 0, // First image is cover if no cover exists
  }));

  await prisma.listingImage.createMany({
    data: imageData,
  });

  return prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });
}

/**
 * Set cover image for a listing
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID
 * @param {number} imageId - The image ID to set as cover
 * @returns {Promise<Object>} - Updated listing with images
 */
export async function setCoverImage(listingId, hostId, imageId) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  await prisma.$transaction(async (tx) => {
    // Remove cover from all images
    await tx.listingImage.updateMany({
      where: { listingId },
      data: { isCover: false },
    });

    // Set new cover
    await tx.listingImage.update({
      where: { id: imageId },
      data: { isCover: true },
    });
  });

  return prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });
}

/**
 * Delete an image from a listing
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID
 * @param {number} imageId - The image ID to delete
 * @returns {Promise<Object>} - Result with message
 */
export async function deleteImage(listingId, hostId, imageId) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  await prisma.listingImage.delete({
    where: { id: imageId },
  });

  return { message: "Image deleted successfully" };
}

/**
 * Update listing status
 * @param {number} listingId - The listing ID
 * @param {number} hostId - The host's user ID
 * @param {string} status - New status (DRAFT or ACTIVE)
 * @returns {Promise<Object>} - Updated listing
 */
export async function updateListingStatus(listingId, hostId, status) {
  // Verify ownership
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
  });

  if (!listing) {
    throw new Error("Listing not found or not authorized");
  }

  return prisma.listing.update({
    where: { id: listingId },
    data: { status },
  });
}