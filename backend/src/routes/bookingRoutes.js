import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as controller from "../controllers/bookingController.js";

const router = express.Router();

// ==================== USER ROUTES ==================== //

// Create new booking(s)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["USER"]),
  controller.createBooking
);

// Get user's bookings
router.get(
  "/",
  authMiddleware,
  controller.getUserBookings
);

// Get upcoming bookings (must be before /:id)
router.get(
  "/upcoming",
  authMiddleware,
  controller.getUpcomingBookings
);

// Get past bookings (must be before /:id)
router.get(
  "/past",
  authMiddleware,
  controller.getPastBookings
);

// Get a specific booking
router.get(
  "/:id",
  authMiddleware,
  controller.getBookingById
);

// Update a booking
router.put(
  "/:id",
  authMiddleware,
  controller.updateBooking
);

// Cancel a booking
router.delete(
  "/:id",
  authMiddleware,
  controller.cancelBooking
);

// ==================== HOST ROUTES ==================== //

// Get bookings for a specific listing (for hosts)
router.get(
  "/listing/:listingId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.getListingBookings
);

export default router;