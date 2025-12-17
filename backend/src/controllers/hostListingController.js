import * as hostListingService from "../services/hostListingServices.js";
import { uploadToS3, deleteFromS3 } from "../config/s3.js"

/**
 * Create a new listing
 * POST /api/host/listings
 */
export async function createListing(req, res) {
  try {
    const hostId = req.user.userId;
    const listing = await hostListingService.createListing(hostId, req.body);
    res.status(201).json(listing);
  } catch (err) {
    console.error("CREATE LISTING ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get all listings for the authenticated host
 * GET /api/host/listings
 */
export async function getHostListings(req, res) {
  try {
    const hostId = req.user.userId;
    const listings = await hostListingService.getListingsByHostId(hostId);
    res.json(listings);
  } catch (err) {
    console.error("GET HOST LISTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get a specific listing by ID
 * GET /api/host/listings/:id
 */
export async function getListingById(req, res) {
  try {
    const listingId = Number(req.params.id);
    const hostId = req.user.userId;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const listing = await hostListingService.getListingByIdForHost(
      listingId,
      hostId
    );

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    console.error("GET LISTING ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Update a listing
 * PUT /api/host/listings/:id
 */
export async function updateListing(req, res) {
  try {
    const listingId = Number(req.params.id);
    const hostId = req.user.userId;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const listing = await hostListingService.updateListing(
      listingId,
      hostId,
      req.body
    );
    res.json(listing);
  } catch (err) {
    console.error("UPDATE LISTING ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Delete a listing
 * DELETE /api/host/listings/:id
 */
export async function deleteListing(req, res) {
  try {
    const listingId = Number(req.params.id);
    const hostId = req.user.userId;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const result = await hostListingService.deleteListing(listingId, hostId);
    res.json(result);
  } catch (err) {
    console.error("DELETE LISTING ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Upload images to a listing
 * POST /api/host/listings/:id/images
 * Expects multipart/form-data with field name "images"
 */
export async function uploadImages(req, res) {
  try {
    const listingId = Number(req.params.id);
    const hostId = req.user.userId;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // Upload each file to S3 in parallel
    const uploadPromises = req.files.map((file) => uploadToS3(file, listingId));
    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs from results
    const imageUrls = uploadResults.map((result) => result.secure_url);

    // Save URLs to listing in database
    const listing = await hostListingService.addImagesToListing(
      listingId,
      hostId,
      imageUrls
    );

    res.json({
      message: `Successfully uploaded ${imageUrls.length} image(s)`,
      listing,
    });
  } catch (err) {
    console.error("UPLOAD IMAGES ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Set cover image
 * PUT /api/host/listings/:id/images/:imageId/cover
 */
export async function setCoverImage(req, res) {
  try {
    const listingId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const hostId = req.user.userId;

    if (isNaN(listingId) || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const listing = await hostListingService.setCoverImage(
      listingId,
      hostId,
      imageId
    );
    res.json(listing);
  } catch (err) {
    console.error("SET COVER IMAGE ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Delete an image
 * DELETE /api/host/listings/:id/images/:imageId
 */
export async function deleteImage(req, res) {
  try {
    const listingId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const hostId = req.user.userId;

    if (isNaN(listingId) || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Get the image info first to get the S3 key
    const imageInfo = await hostListingService.getImageById(imageId, hostId);

    if (imageInfo?.s3Key) {
      // Delete from S3
      await deleteFromS3(imageInfo.s3Key);
    }

    // Delete from database
    const result = await hostListingService.deleteImage(
      listingId,
      hostId,
      imageId
    );
    res.json(result);
  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}

/**
 * Update listing status
 * PATCH /api/host/listings/:id/status
 */
export async function updateStatus(req, res) {
  try {
    const listingId = Number(req.params.id);
    const hostId = req.user.userId;
    const { status } = req.body;

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    if (!["DRAFT", "ACTIVE"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Use DRAFT or ACTIVE" });
    }

    const listing = await hostListingService.updateListingStatus(
      listingId,
      hostId,
      status
    );
    res.json(listing);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
}