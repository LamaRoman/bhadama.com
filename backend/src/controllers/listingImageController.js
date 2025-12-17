import * as listingImageService from "../services/listingImageService.js";
import { uploadToS3 } from "../config/s3.js"; // Adjust based on your setup

/**
 * Upload images to a listing
 * POST /api/listings/:listingId/images
 */
export async function uploadImages(req, res) {
  try {
    const listingId = Number(req.params.listingId);

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Upload files to cloud storage (Cloudinary, S3, etc.)
    const uploadPromises = files.map((file) =>
      uploadToS3(file.buffer, {
        folder: `listings/${listingId}`,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((result) => result.secure_url);

    // Save to database
    const images = await listingImageService.addImages(listingId, imageUrls);

    res.json({
      message: "Images uploaded successfully",
      images,
    });
  } catch (err) {
    console.error("UPLOAD IMAGES ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get all images for a listing
 * GET /api/listings/:listingId/images
 */
export async function getImages(req, res) {
  try {
    const listingId = Number(req.params.listingId);

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const images = await listingImageService.getImagesByListingId(listingId);
    res.json(images);
  } catch (err) {
    console.error("GET IMAGES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Set an image as cover
 * PUT /api/listings/:listingId/images/:imageId/cover
 */
export async function setCoverImage(req, res) {
  try {
    const listingId = Number(req.params.listingId);
    const imageId = Number(req.params.imageId);

    if (isNaN(listingId) || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const image = await listingImageService.setCoverImage(listingId, imageId);
    res.json({
      message: "Cover image updated",
      image,
    });
  } catch (err) {
    console.error("SET COVER IMAGE ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Delete an image
 * DELETE /api/listings/:listingId/images/:imageId
 */
export async function deleteImage(req, res) {
  try {
    const listingId = Number(req.params.listingId);
    const imageId = Number(req.params.imageId);

    if (isNaN(listingId) || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await listingImageService.deleteImage(listingId, imageId);
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Reorder images
 * PUT /api/listings/:listingId/images/reorder
 */
export async function reorderImages(req, res) {
  try {
    const listingId = Number(req.params.listingId);
    const { imageIds } = req.body;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: "Image IDs array is required" });
    }

    const images = await listingImageService.reorderImages(listingId, imageIds);
    res.json({
      message: "Images reordered successfully",
      images,
    });
  } catch (err) {
    console.error("REORDER IMAGES ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}