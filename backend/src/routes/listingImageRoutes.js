import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {upload} from "../middleware/uploadMemory.js"
import * as controller from "../controllers/listingImageController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ==================== //

// Get all images for a listing
router.get("/:listingId/images", controller.getImages);

// ==================== HOST ROUTES ==================== //

// Upload images to a listing
router.post(
  "/:listingId/images",
  authMiddleware,
  roleMiddleware(["HOST"]),
  upload.array("images", 5), // max 5 images
  controller.uploadImages
);

// Set an image as cover
router.put(
  "/:listingId/images/:imageId/cover",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.setCoverImage
);

// Delete an image
router.delete(
  "/:listingId/images/:imageId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.deleteImage
);

// Reorder images
router.put(
  "/:listingId/images/reorder",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.reorderImages
);

export default router;