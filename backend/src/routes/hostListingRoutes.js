import express from "express";
import {
  createListing,
  getHostListings,
  getListingById,
  updateListing,
  deleteListing,
  uploadImages,
  setCoverImage,
  deleteImage,
  updateStatus,
} from "../controllers/hostListingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"
import  {upload, handleMulterError}  from "../middleware/multer.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Listing CRUD operations
router.post("/", createListing);
router.get("/", getHostListings);
router.get("/:id", getListingById);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);

// Image management routes
// upload.array("images", 10) - accepts up to 10 files with field name "images"
router.post(
  "/:id/images",
  upload.array("images", 10),
  handleMulterError,
  uploadImages
);
router.put("/:id/images/:imageId/cover", setCoverImage);
router.delete("/:id/images/:imageId", deleteImage);

// Status management
router.patch("/:id/status", updateStatus);

export default router;