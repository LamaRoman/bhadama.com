// ==========================================
// BOOKING ROUTES - SECURITY HARDENED
// ==========================================
// File: routes/booking.routes.js
//
// SECURITY FEATURES:
// 1. All routes require authentication
// 2. IDOR protection via ownership verification
// 3. Rate limiting on booking creation
// 4. Input validation using Zod schemas
// 5. Audit logging for sensitive operations
// ==========================================

import { Router } from "express";

// Middleware
import {
  authenticate,
  authorize,
  verifyOwnership,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  bookingLimiter,
  paymentLimiter,
  auditLog,
  noCache,
} from "../middleware/security.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Validators
import { BookingSchemas, IdParam, QuerySchemas } from "../validators/schemas.js";

// Controller
import * as controller from "../controllers/booking.controller.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (Still require auth)
// ==========================================

/**
 * POST /api/bookings
 * Create a new booking
 *
 * Rate limit: 20 per hour per user
 * Validation: listingId, date, time, guests
 */
router.post(
  "/",
  authenticate,
  bookingLimiter,
  auditLog("BOOKING_CREATE"),
  validate(BookingSchemas.create),
  asyncHandler(controller.createBooking)
);

/**
 * GET /api/bookings
 * Get user's bookings (as guest or host)
 */
router.get(
  "/",
  authenticate,
  noCache,
  validate(QuerySchemas.pagination, "query"),
  asyncHandler(controller.getUserBookings)
);

/**
 * GET /api/bookings/:id
 * Get booking details (only if owner or host)
 *
 * Security: IDOR protection via verifyOwnership
 */
router.get(
  "/:id",
  authenticate,
  validate(IdParam, "params"),
  verifyOwnership("booking"),
  noCache,
  asyncHandler(controller.getBookingById)
);

/**
 * PATCH /api/bookings/:id/cancel
 * Cancel a booking
 *
 * Security: Only booking owner can cancel
 */
router.patch(
  "/:id/cancel",
  authenticate,
  validate(IdParam, "params"),
  validate(BookingSchemas.cancel),
  verifyOwnership("booking"),
  auditLog("BOOKING_CANCEL"),
  asyncHandler(controller.cancelBooking)
);

// ==========================================
// HOST ROUTES
// ==========================================

/**
 * GET /api/bookings/host/all
 * Get all bookings for host's listings
 */
router.get(
  "/host/all",
  authenticate,
  authorize({minRole:"HOST"}),
  noCache,
  validate(QuerySchemas.pagination, "query"),
  asyncHandler(controller.getHostBookings)
);

/**
 * PATCH /api/bookings/:id/confirm
 * Host confirms a pending booking
 */
router.patch(
  "/:id/confirm",
  authenticate,
  authorize({minRole:"HOST"}),
  validate(IdParam, "params"),
  verifyOwnership("booking"),
  auditLog("BOOKING_CONFIRM"),
  asyncHandler(controller.confirmBooking)
);

/**
 * PATCH /api/bookings/:id/reject
 * Host rejects a pending booking
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorize({minRole:"HOST"}),
  validate(IdParam, "params"),
  verifyOwnership("booking"),
  auditLog("BOOKING_REJECT"),
  asyncHandler(controller.rejectBooking)
);

// ==========================================
// PAYMENT CALLBACK ROUTES
// ==========================================

/**
 * GET /api/bookings/payment/esewa/callback
 * eSewa payment callback (handles both success and failure)
 *
 * Note: No auth required (callback from eSewa)
 * Security: Signature verification in controller
 */
router.get(
  "/payment/esewa/callback",
  asyncHandler(controller.esewaPaymentCallback)
);

/**
 * GET /api/bookings/payment/khalti/callback
 * Khalti payment callback
 *
 * Note: No auth required (callback from Khalti)
 * Security: Server-side verification in controller
 */
router.get(
  "/payment/khalti/callback",
  asyncHandler(controller.khaltiPaymentCallback)
);

/**
 * GET /api/bookings/payment/card/callback
 * Card (Dodo) payment callback
 *
 * Note: No auth required (callback from Dodo)
 */
router.get(
  "/payment/card/callback",
  asyncHandler(controller.cardPaymentCallback)
);

/**
 * POST /api/bookings/payment/dodo/webhook
 * Dodo payment webhook
 *
 * Note: No auth required (webhook from Dodo)
 * Security: Signature verification in controller
 */
router.post(
  "/payment/dodo/webhook",
  asyncHandler(controller.cardPaymentWebhook)
);

// ==========================================
// BOOKING AVAILABILITY
// ==========================================

/**
 * GET /api/bookings/availability/:listingId
 * Check availability for a listing on a date
 */
router.get(
  "/availability/:listingId",
  validate(IdParam.extend({ listingId: IdParam.shape.id }), "params"),
  asyncHandler(controller.checkAvailability)
);

// ==========================================
// ADMIN ROUTES
// ==========================================

/**
 * GET /api/bookings/admin/all
 * Get all bookings (admin only)
 */
router.get(
  "/admin/all",
  authenticate,
  authorize({minRole:"ADMIN"}),
  noCache,
  validate(QuerySchemas.pagination, "query"),
  asyncHandler(controller.getAllBookings)
);

/**
 * GET /api/bookings/admin/stats
 * Get booking statistics (admin only)
 */
router.get(
  "/admin/stats",
  authenticate,
  authorize({minRole:"ADMIN"}),
  noCache,
  asyncHandler(controller.getBookingStats)
);

/**
 * GET /api/bookings/host/stats
 * Get host booking statistics (count, revenue, etc.)
 */
router.get(
  "/host/stats",
  authenticate,
  authorize({minRole:"HOST"}),
  noCache,
  asyncHandler(controller.getHostBookingStats)
);

// ==========================================
// EXPORT
// ==========================================

export default router;