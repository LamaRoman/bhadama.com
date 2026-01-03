// ==========================================
// TIER SYSTEM ROUTES (UPDATED)
// ==========================================
// Includes new proration and listing management endpoints
// ==========================================

import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkAdminHierarchy } from "../middleware/adminAuth.js";

// Controllers
import tierManagementController from "../controllers/tierManagementController.js";
import hostSubscriptionController from "../controllers/hostSubscriptionController.js";
import paymentController from "../controllers/paymentController.js";

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

const publicRouter = express.Router();

// Get available tiers and pricing (for tier selection page)
publicRouter.get("/tiers", hostSubscriptionController.getAvailableTiers);

// Get available payment gateways
publicRouter.get("/gateways", paymentController.getAvailableGateways);

// ==========================================
// HOST SUBSCRIPTION ROUTES
// ==========================================

const hostRouter = express.Router();

// All routes require authentication
hostRouter.use(authenticate);

// --- Current Subscription ---
// Get current subscription details
hostRouter.get("/subscription", hostSubscriptionController.getCurrentSubscription);

// Get subscription history
hostRouter.get("/subscription/history", hostSubscriptionController.getSubscriptionHistory);

// --- Initial Tier Selection ---
// Select/Start tier (includes trial) - for new subscriptions
hostRouter.post("/subscription/select", hostSubscriptionController.selectTier);

// --- UPGRADE FLOW (NEW) ---
// Preview upgrade with proration calculation
hostRouter.get("/subscription/upgrade-preview", hostSubscriptionController.getUpgradePreviewEndpoint);

// Execute upgrade (creates prorated payment)
hostRouter.post("/subscription/upgrade", hostSubscriptionController.upgradeSubscription);

// --- DOWNGRADE FLOW (NEW) ---
// Preview downgrade with listing impact
hostRouter.get("/subscription/downgrade-preview", hostSubscriptionController.getDowngradePreviewEndpoint);

// Execute downgrade (starts grace period if needed)
hostRouter.post("/subscription/downgrade", hostSubscriptionController.downgradeSubscription);

// --- LISTING MANAGEMENT (NEW) ---
// Get listings that are over tier limit
hostRouter.get("/listings/over-limit", hostSubscriptionController.getOverLimitListingsEndpoint);

// Select which listings to keep active
hostRouter.post("/listings/select-to-keep", hostSubscriptionController.selectListingsToKeepEndpoint);

// Get archived listings
hostRouter.get("/listings/archived", hostSubscriptionController.getArchivedListingsEndpoint);

// Restore a single archived listing
hostRouter.post("/listings/:listingId/restore", hostSubscriptionController.restoreListingEndpoint);

// --- Other Subscription Actions ---
// Cancel subscription
hostRouter.post("/subscription/cancel", hostSubscriptionController.cancelSubscription);

// Check tier limits (listings, blogs, etc.)
hostRouter.get("/limits", hostSubscriptionController.checkTierLimits);

// Legacy change tier (redirects to upgrade/downgrade)
hostRouter.post("/subscription/change", hostSubscriptionController.changeTier);

// ==========================================
// PAYMENT ROUTES (Host)
// ==========================================

const paymentRouter = express.Router();

// Authenticated routes
paymentRouter.use(authenticate);

// Initiate payment
paymentRouter.post("/initiate", paymentController.initiatePayment);

// Get payment history
paymentRouter.get("/history", paymentController.getPaymentHistory);

// Get payment details
paymentRouter.get("/:paymentId", paymentController.getPaymentDetails);

// ==========================================
// PAYMENT CALLBACK ROUTES (Public - called by gateways)
// ==========================================

const callbackRouter = express.Router();

// eSewa callback
callbackRouter.get("/esewa/success", paymentController.esewaCallback);
callbackRouter.get("/esewa/failed", (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/payment/failed?gateway=esewa`);
});

// Khalti callback
callbackRouter.get("/khalti/callback", paymentController.khaltiCallback);

// Dodo webhook
callbackRouter.post("/dodo/webhook", paymentController.dodoWebhook);

// ==========================================
// ADMIN ROUTES (Tier Management)
// ==========================================

const adminRouter = express.Router();

// All routes require admin authentication
adminRouter.use(authenticate);
adminRouter.use(authorize("ADMIN"));

// --- SUPER_ADMIN Only ---

// Seed default tiers (one-time setup)
adminRouter.post(
  "/tiers/seed",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.seedDefaultTiers
);

// Update tier settings
adminRouter.put(
  "/tiers/:tierId",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.updateTier
);

// Update tier pricing
adminRouter.put(
  "/tiers/:tierId/pricing",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.updateTierPricing
);

// Manually change host tier
adminRouter.post(
  "/subscriptions/:subscriptionId/change-tier",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.changeHostTier
);

// Extend subscription
adminRouter.post(
  "/subscriptions/:subscriptionId/extend",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.extendSubscription
);

// Cancel subscription
adminRouter.post(
  "/subscriptions/:subscriptionId/cancel",
  checkAdminHierarchy("SUPER_ADMIN"),
  tierManagementController.cancelSubscription
);

// --- FINANCE, ANALYST, SUPER_ADMIN ---

// Get all tiers
adminRouter.get(
  "/tiers",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getAllTiers
);

// Get single tier
adminRouter.get(
  "/tiers/:tierId",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getTier
);

// Get all pricing
adminRouter.get(
  "/pricing",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getAllPricing
);

// Get all subscriptions
adminRouter.get(
  "/subscriptions",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getAllSubscriptions
);

// Get subscription details
adminRouter.get(
  "/subscriptions/:subscriptionId",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getSubscription
);

// Get tier statistics
adminRouter.get(
  "/stats",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getTierStats
);

// Get revenue report
adminRouter.get(
  "/revenue",
  checkAdminHierarchy("FINANCE"),
  tierManagementController.getRevenueReport
);

// ==========================================
// EXPORT ALL ROUTERS
// ==========================================

export {
  publicRouter as tierPublicRoutes,
  hostRouter as hostSubscriptionRoutes,
  paymentRouter as paymentRoutes,
  callbackRouter as paymentCallbackRoutes,
  adminRouter as adminTierRoutes,
};

// ==========================================
// SERVER INTEGRATION
// ==========================================
// Add these to your server.js:
//
// import {
//   tierPublicRoutes,
//   hostSubscriptionRoutes,
//   paymentRoutes,
//   paymentCallbackRoutes,
//   adminTierRoutes,
// } from "./routes/tierRoutes.js";
//
// // Public tier info
// app.use("/api/public", tierPublicRoutes);
//
// // Host subscription management
// app.use("/api/host/tier", hostSubscriptionRoutes);
//
// // Payment routes
// app.use("/api/payments", paymentRoutes);
//
// // Payment callbacks (called by gateways)
// app.use("/api/payments/callback", paymentCallbackRoutes);
//
// // Admin tier management
// app.use("/api/admin/tiers", adminTierRoutes);
// ==========================================

// ==========================================
// CRON JOB SETUP
// ==========================================
// Add this to your server.js or a separate cron file:
//
// import cron from "node-cron";
// import { runAllGracePeriodJobs } from "./jobs/gracePeriodEnforcer.js";
//
// // Run daily at midnight
// cron.schedule("0 0 * * *", async () => {
//   console.log("Running grace period enforcement jobs...");
//   await runAllGracePeriodJobs();
// });
// ==========================================