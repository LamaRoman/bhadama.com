import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/availability.controller.js";

const router = express.Router();

// IMPORTANT: More specific routes must come BEFORE parameterized routes
// Otherwise /:listingId will catch everything

// Public routes - anyone can check availability
router.post("/check", controller.checkSlotAvailability);

// These specific routes must come before /:listingId
router.get("/:listingId/dates", controller.getBookedDates);
router.get("/:listingId/summary", controller.getAvailabilitySummary);

// Protected routes - HOST only (specific routes)
router.post(
  "/:listingId/block",
  authenticate,
  authorize({minRole:"HOST"}),
  controller.blockDate
);

router.delete(
  "/blocked/:blockedDateId",
  authenticate,
  authorize({minRole:"HOST"}),
  controller.unblockDate
);

// General availability (should be last as it's most generic)
router.get("/:listingId", controller.getAvailability);
router.get("/:listingId/calendar", controller.getCalendarAvailability);
export default router;