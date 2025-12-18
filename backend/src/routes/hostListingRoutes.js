import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { upload, handleMulterError } from "../middleware/multer.js";

import {
  createListing,
  getHostListings,
  getListingById,
  updateListing,
  deleteListing,
  updateStatus,
  uploadImages,
  setCoverImage,
  deleteImage,
} from "../controllers/hostListingController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["HOST"]));

// Listings
router.post("/", createListing);
router.get("/", getHostListings);
router.get("/:id", getListingById);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);
router.patch("/:id/status", updateStatus);

// Images
router.post(
  "/:id/images",
  upload.array("images", 10),
  handleMulterError,
  uploadImages
);

router.put("/:id/images/:imageId/cover", setCoverImage);
router.delete("/:id/images/:imageId", deleteImage);

export default router;
