import { prisma } from "../config/prisma.js";

/**
 * Add images to a listing
 * @param {number} listingId - The listing ID
 * @param {string[]} imageUrls - Array of image URLs
 * @returns {Promise<Array>} - Array of created image records
 */
export async function addImages(listingId, imageUrls) {
  // Check if listing already has a cover image
  const existingImages = await prisma.listingImage.findMany({
    where: { listingId },
  });

  const hasCover = existingImages.some((img) => img.isCover);

  const imageData = imageUrls.map((url, index) => ({
    listingId,
    url,
    isCover: !hasCover && index === 0, // First image is cover if no cover exists
  }));

  await prisma.listingImage.createMany({
    data: imageData,
  });

  return prisma.listingImage.findMany({
    where: { listingId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get all images for a listing
 * @param {number} listingId - The listing ID
 * @returns {Promise<Array>} - Array of images
 */
export async function getImagesByListingId(listingId) {
  return prisma.listingImage.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Set an image as cover
 * @param {number} listingId - The listing ID
 * @param {number} imageId - The image ID to set as cover
 * @returns {Promise<Object>} - Updated image
 */
export async function setCoverImage(listingId, imageId) {
  // Verify image belongs to listing
  const image = await prisma.listingImage.findFirst({
    where: { id: imageId, listingId },
  });

  if (!image) {
    throw new Error("Image not found");
  }

  // Remove cover from all images
  await prisma.listingImage.updateMany({
    where: { listingId },
    data: { isCover: false },
  });

  // Set new cover
  return prisma.listingImage.update({
    where: { id: imageId },
    data: { isCover: true },
  });
}

/**
 * Delete an image
 * @param {number} listingId - The listing ID
 * @param {number} imageId - The image ID to delete
 * @returns {Promise<Object>} - Deleted image
 */
export async function deleteImage(listingId, imageId) {
  // Verify image belongs to listing
  const image = await prisma.listingImage.findFirst({
    where: { id: imageId, listingId },
  });

  if (!image) {
    throw new Error("Image not found");
  }

  const deleted = await prisma.listingImage.delete({
    where: { id: imageId },
  });

  // If deleted image was cover, set another image as cover
  if (image.isCover) {
    const firstImage = await prisma.listingImage.findFirst({
      where: { listingId },
      orderBy: { createdAt: "asc" },
    });

    if (firstImage) {
      await prisma.listingImage.update({
        where: { id: firstImage.id },
        data: { isCover: true },
      });
    }
  }

  return deleted;
}

/**
 * Reorder images
 * @param {number} listingId - The listing ID
 * @param {number[]} imageIds - Array of image IDs in desired order
 * @returns {Promise<Array>} - Reordered images
 */
export async function reorderImages(listingId, imageIds) {
  // Verify all images belong to listing
  const images = await prisma.listingImage.findMany({
    where: { listingId },
  });

  const existingIds = images.map((img) => img.id);
  const validOrder = imageIds.every((id) => existingIds.includes(id));

  if (!validOrder) {
    throw new Error("Invalid image IDs");
  }

  // Update order (using createdAt as a workaround since we don't have an order field)
  // In production, you'd want to add an "order" field to the schema
  const baseTime = new Date();
  const updates = imageIds.map((id, index) =>
    prisma.listingImage.update({
      where: { id },
      data: {
        createdAt: new Date(baseTime.getTime() + index * 1000),
      },
    })
  );

  await Promise.all(updates);

  return prisma.listingImage.findMany({
    where: { listingId },
    orderBy: { createdAt: "asc" },
  });
}