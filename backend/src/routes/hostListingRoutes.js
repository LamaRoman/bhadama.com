// routes/hostListingRoutes.js
// COMPLETE: Listing CRUD + Images + Discounts + Duration Discounts + Settings
// Uses your existing multer middleware and image controller

import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import * as listingController from "../controllers/hostListingController.js";
import * as discountController from "../controllers/hostDiscountController.js";
import * as imageController from "../controllers/listingImageController.js";

const router = express.Router();

// All routes require HOST authentication
router.use(authenticate);
router.use(authorize(["HOST"]));

// ============ LISTING CRUD ============
router.get("/", listingController.getHostListings);
router.get("/:id", listingController.getListingById);
router.post("/", listingController.createListing);
router.put("/:id", listingController.updateListing);
router.patch("/:id", listingController.updateListing);
router.delete("/:id", listingController.deleteListing);

// ============ IMAGE MANAGEMENT ============
// Map :id to :listingId for your existing image controller
router.get("/:id/images", (req, res, next) => {
  req.params.listingId = req.params.id;
  next();
}, imageController.getImages);

router.post("/:id/images", upload.array("images", 5), (req, res, next) => {
  req.params.listingId = req.params.id;
  next();
}, imageController.uploadImages);

router.put("/:id/images/:imageId/cover", (req, res, next) => {
  req.params.listingId = req.params.id;
  next();
}, imageController.setCoverImage);

router.delete("/:id/images/:imageId", (req, res, next) => {
  req.params.listingId = req.params.id;
  next();
}, imageController.deleteImage);

router.put("/:id/images/reorder", (req, res, next) => {
  req.params.listingId = req.params.id;
  next();
}, imageController.reorderImages);

// Add this after IMAGE MANAGEMENT section:

// ============ DURATION-BASED DISCOUNTS (NEW) ============
router.get("/:listingId/duration-discounts", discountController.getDurationDiscounts);
router.delete("/:listingId/duration-discounts", discountController.removeDurationDiscounts);
router.put("/:listingId/duration-discounts", discountController.setDurationDiscounts);


// Alternative endpoint for frontend compatibility
router.post("/:listingId/discount", discountController.setListingDiscount);
router.put("/:listingId/discount", discountController.setListingDiscount);
router.delete("/:listingId/discount",discountController.removeListingDiscount);
// ============ SPECIAL PRICING ============
router.get("/:id/special-pricing", discountController.getSpecialPricing);
router.post("/:id/special-pricing", discountController.addSpecialPricing);
router.delete("/:id/special-pricing/:pricingId", discountController.removeSpecialPricing);

// ============ BLOCKED DATES ============
router.get("/:id/blocked-dates", discountController.getBlockedDates);
router.post("/:id/block-dates", discountController.blockDates);
router.delete("/:id/block-dates/:blockId", discountController.unblockDates);

// ============ BOOKING SETTINGS ============
router.get("/:id/booking-settings", discountController.getBookingSettings);
router.put("/:id/booking-settings", discountController.updateBookingSettings);

// ============ PROMOTION REQUESTS ============
router.get("/:id/promotion-request", discountController.getPromotionRequest);
router.post("/:id/promotion-request", discountController.submitPromotionRequest);
router.delete("/:id/promotion-request", discountController.cancelPromotionRequest);

export default router;