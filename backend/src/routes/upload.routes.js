// routes/upload.routes.js
// ==========================================
// GENERIC UPLOAD ROUTES
// ==========================================
// Handles file uploads to Cloudinary
// ==========================================

import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import * as uploadController from "../controllers/upload.controller.js";

const router = express.Router();

// Configure multer for memory storage (same as listing images)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ==========================================
// ROUTES
// ==========================================

/**
 * @route   POST /api/upload
 * @desc    Upload a single file
 * @access  Private
 * @body    file (form-data), type: 'story' | 'profile' | 'general'
 */
router.post(
  "/",
  authenticate,
  upload.single("file"),
  uploadController.uploadFile
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files
 * @access  Private
 * @body    files (form-data), type: 'listing' | 'general', listingId (optional)
 */
router.post(
  "/multiple",
  authenticate,
  upload.array("files", 10),
  uploadController.uploadMultipleFiles
);

/**
 * @route   DELETE /api/upload
 * @desc    Delete a file from Cloudinary
 * @access  Private
 * @body    { publicId: string }
 */
router.delete(
  "/",
  authenticate,
  uploadController.deleteFile
);

export default router;