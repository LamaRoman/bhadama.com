// controllers/upload.controller.js
// ==========================================
// GENERIC UPLOAD CONTROLLER
// ==========================================
// Handles file uploads to Cloudinary for various purposes
// Matches existing cloudinary.config.js patterns
// ==========================================

import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

/**
 * Upload a single file
 * POST /api/upload
 * Body (form-data): file, type (story|profile|general)
 */
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;
    const type = req.body.type || "general";

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Determine folder based on type
    let folder;
    switch (type) {
      case "story":
        folder = `host-stories/${userId}`;
        break;
      case "profile":
        folder = `profiles/${userId}`;
        break;
      default:
        folder = `uploads/${userId}`;
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, folder);

    console.log(`[UPLOAD] ${type} image uploaded for user ${userId}`);

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to upload file" });
  }
};

/**
 * Upload multiple files
 * POST /api/upload/multiple
 * Body (form-data): files, type (listing|general), listingId (optional)
 */
export const uploadMultipleFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const files = req.files;
    const type = req.body.type || "general";
    const listingId = req.body.listingId;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Determine folder based on type
    let folder;
    if (type === "listing" && listingId) {
      folder = `listings/${listingId}`;
    } else {
      folder = `uploads/${userId}`;
    }

    // Upload all files
    const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);

    console.log(`[UPLOAD] ${files.length} files uploaded for user ${userId}`);

    res.json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      })),
    });
  } catch (err) {
    console.error("UPLOAD MULTIPLE ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to upload files" });
  }
};

/**
 * Delete a file from Cloudinary
 * DELETE /api/upload
 * Body: { publicId: string }
 */
export const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "publicId is required" });
    }

    await deleteFromCloudinary(publicId);

    console.log(`[UPLOAD] File deleted: ${publicId}`);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    console.error("DELETE FILE ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to delete file" });
  }
};