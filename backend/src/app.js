// server.js
import express from "express";
import 'dotenv/config';
import passport from "./config/passport.config.js";

// Security
import { applySecurityMiddleware } from "./middleware/security.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

// Import routes
import notificationRoutes from './routes/notificaion.route.js';
import verificationRoutes from './routes/verification.routes.js';
import authRoutes from "./routes/auth.routes.js";
import hostDashboardRoutes from "./routes/host.dashboard.routes.js";
import hostListingRoutes from "./routes/host.listing.Routes.js";
import publicListingRoutes from "./routes/public.listing.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import userRoutes from "./routes/user.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import adminRoutes from './routes/admin.routes.js';
import reviewRoutes from './routes/review.routes.js';
import hostReviewRoutes from './routes/host.review.routes.js';
import discoveryRoutes from "./routes/discovery.routes.js";
import { completeExpiredBookings } from "./controllers/booking.controller.js";

import blogRoutes from "./routes/blog.routes.js";
import userBlogRoutes from "./routes/user.blog.routes.js";
import hostBlogRoutes from "./routes/host.blog.routes.js";
import adminBlogRoutes from "./routes/admin.blog.routes.js";

import supportRoutes from "./routes/support.routes.js";

import {
  tierPublicRoutes,
  hostSubscriptionRoutes,
  paymentRoutes,
  paymentCallbackRoutes,
  adminTierRoutes,
} from "./routes/tier.routes.js";

const app = express();

// ============ SECURITY MIDDLEWARE (MUST BE FIRST!) ============
// This applies: CORS, Security Headers, Rate Limiting, 
// Input Sanitization, Injection Detection, Request ID Tracking
applySecurityMiddleware(app);

// ============ BODY PARSERS (AFTER SECURITY) ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============ PASSPORT ============
app.use(passport.initialize());

// ============ ROUTES ============

// Auth & Verification
app.use("/api/auth", authRoutes);
app.use('/api/verification', verificationRoutes);

// Host routes
app.use("/api/host/listings", hostListingRoutes);
app.use("/api/host/dashboard", hostDashboardRoutes);
app.use("/api/host/reviews", hostReviewRoutes);
app.use("/api/host/tier", hostSubscriptionRoutes);
app.use("/api/host/blogs", hostBlogRoutes);

// Public routes
app.use("/api/publicListings", publicListingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/discover", discoveryRoutes);
app.use("/api/public", tierPublicRoutes);
app.use("/api/blogs", blogRoutes);

// User routes
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user/blogs", userBlogRoutes);
app.use("/api/support", supportRoutes);

// Payment routes
app.use("/api/payments", paymentRoutes);
app.use("/api/payments/callback", paymentCallbackRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin/tiers", adminTierRoutes);
app.use("/api/admin/blogs", adminBlogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    emailVerification: !!process.env.RESEND_API_KEY,
    smsVerification: {
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      sparrow: !!process.env.SPARROW_API_TOKEN
    }
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Hello! myBigYard Server is working. 🏡");
});

// ============ ERROR HANDLERS (MUST BE LAST!) ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ BACKGROUND JOBS ============

// Run once at startup
completeExpiredBookings();

// Run every 5 minutes
setInterval(async () => {
  try {
    await completeExpiredBookings();
  } catch (err) {
    console.error("❌ Booking completion job failed:", err);
  }
}, 5 * 60 * 1000);

// ============ START SERVER ============

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security middleware: ✅ Enabled`);
  console.log(`📧 Email verification: ${process.env.RESEND_API_KEY ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`📱 SMS verification (Nepal): ${process.env.SMS_NEPAL_PROVIDER || 'twilio'}`);
  console.log(`📱 SMS verification (International): ${process.env.SMS_INTERNATIONAL_PROVIDER || 'twilio'}`);
});