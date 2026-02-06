// ==========================================
// PAYMENT ROUTES - SECURITY HARDENED
// ==========================================
// File: routes/payment.route.js
//
// SECURITY FEATURES:
// 1. All routes require authentication (except callbacks)
// 2. IDOR protection via ownership verification
// 3. Rate limiting on payment initiation
// 4. Webhook signature verification
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
  paymentLimiter,
  auditLog,
  noCache,
} from "../middleware/security.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Validators
import { PaymentSchemas, IdParam, QuerySchemas } from "../validators/schemas.js";

// Controller
import * as controller from "../controllers/payment.controller.js";

const router = Router();

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

/**
 * POST /api/payments/initiate
 * Initiate a payment for a subscription
 *
 * Rate limit: 5 per minute per user
 */
router.post(
  "/initiate",
  authenticate,
  paymentLimiter,
  auditLog("PAYMENT_INITIATE"),
  validate(PaymentSchemas.initiate),
  asyncHandler(controller.initiatePayment)
);

/**
 * GET /api/payments/history
 * Get payment history for current user
 */
router.get(
  "/history",
  authenticate,
  noCache,
  validate(QuerySchemas.pagination, "query"),
  asyncHandler(controller.getPaymentHistory)
);

/**
 * GET /api/payments/:paymentId
 * Get payment details
 *
 * Security: IDOR protection - only owner can access
 */
router.get(
  "/:paymentId",
  authenticate,
  validate(IdParam.extend({ paymentId: IdParam.shape.id }), "params"),
  verifyOwnership("payment"),
  noCache,
  asyncHandler(controller.getPaymentDetails)
);

/**
 * GET /api/payments/gateways
 * Get available payment gateways
 */
router.get(
  "/gateways",
  authenticate,
  asyncHandler(controller.getAvailableGateways)
);

// ==========================================
// PAYMENT CALLBACKS (No Auth - From Gateways)
// ==========================================

/**
 * GET /api/payments/callback/esewa/success
 * eSewa success callback
 *
 * Security: Signature verification in controller
 */
router.get(
  "/callback/esewa/success",
  auditLog("ESEWA_CALLBACK"),
  asyncHandler(controller.esewaCallback)
);

/**
 * GET /api/payments/callback/khalti
 * Khalti callback
 *
 * Security: Server-side verification in controller
 */
router.get(
  "/callback/khalti",
  auditLog("KHALTI_CALLBACK"),
  asyncHandler(controller.khaltiCallback)
);

/**
 * POST /api/payments/webhook/dodo
 * Dodo webhook
 *
 * Security: Signature verification in controller
 */
router.post(
  "/webhook/dodo",
  auditLog("DODO_WEBHOOK"),
  asyncHandler(controller.dodoWebhook)
);

// ==========================================
// ADMIN ROUTES
// ==========================================

/**
 * GET /api/payments/admin/all
 * Get all payments (admin only)
 */
router.get(
  "/admin/all",
  authenticate,
  authorize("ADMIN"),
  noCache,
  validate(QuerySchemas.pagination, "query"),
  asyncHandler(controller.getAllPayments || ((req, res) => res.json({ message: "Not implemented" })))
);

/**
 * POST /api/payments/admin/refund/:paymentId
 * Process a refund (admin only)
 */
router.post(
  "/admin/refund/:paymentId",
  authenticate,
  authorize("ADMIN"),
  auditLog("PAYMENT_REFUND"),
  asyncHandler(controller.processRefund || ((req, res) => res.json({ message: "Not implemented" })))
);

// ==========================================
// EXPORT
// ==========================================

export default router;