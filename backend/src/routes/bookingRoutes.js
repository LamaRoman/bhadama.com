// ============================================
// BOOKING ROUTES - Multi-Gateway Support
// ============================================
// File: routes/bookingRoutes.js
// ============================================

import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { requireEmailVerification } from "../middleware/verificationMiddleware.js";
import * as controller from "../controllers/bookingController.js";

const router = express.Router();

// ============================================
// BOOKING CRUD
// ============================================

// Create booking (requires auth + email verification)
router.post("/", authenticate, requireEmailVerification, controller.createBooking);

// Get user's bookings
router.get("/user", authenticate, controller.getUserBookings);

// Get host's bookings
router.get("/host", authenticate, authorize(["HOST", "ADMIN"]), controller.getHostBookings);

// Get availability
router.get("/availability/:listingId", controller.getAvailability);

// Get booking by ID
router.get("/:id", authenticate, controller.getBookingById);

// Cancel booking
router.put("/:id/cancel", authenticate, controller.cancelBooking);

// ============================================
// PAYMENT CALLBACKS (NO AUTH - Called by payment gateways)
// ============================================

// eSewa callbacks
router.get("/payment/esewa/success", controller.esewaPaymentSuccess);
router.get("/payment/esewa/failure", controller.esewaPaymentFailure);

// Khalti callback
router.get("/payment/khalti/callback", controller.khaltiPaymentCallback);

// Card (Dodo) callbacks
router.get("/payment/card/callback", controller.cardPaymentCallback);
router.post("/payment/card/webhook", express.json(), controller.cardPaymentWebhook);

export default router;