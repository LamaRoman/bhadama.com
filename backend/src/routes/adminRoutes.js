import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.use(authenticate);

// Dashboard
router.get(
  "/dashboard",
  authorize({ minRole: "ADMIN" }),
  adminController.getDashboard
);

// Listing moderation
router.post(
  "/listings/:id/approve",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.moderateListing
);

// Refunds
router.post(
  "/refunds/:bookingId",
  authorize({ minRole: "ADMIN", adminRoles: ["FINANCE"] }),
  adminController.issueRefund
);

// Reported reviews
router.get(
  "/reviews/reported",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.getReportedReviews
);

export default router;
