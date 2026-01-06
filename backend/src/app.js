// server.js
import express from "express";
import 'dotenv/config';
import cors from "cors";
import passport from "./config/passport.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import hostDashboardRoutes from "./routes/hostDashboardRoutes.js";
import hostListingRoutes from "./routes/hostListingRoutes.js";
import publicListingRoutes from "./routes/publicListingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import hostReviewRoutes from './routes/hostReviewRoutes.js';
import discoveryRoutes from "./routes/discoveryRoutes.js";
import { completeExpiredBookings } from "./controllers/bookingController.js";

import blogRoutes from "./routes/blogRoutes.js";
import userBlogRoutes from "./routes/userBlogRoutes.js";
import hostBlogRoutes from "./routes/hostBlogRoutes.js";
import adminBlogRoutes from "./routes/adminBlogRoutes.js";
const app = express();

// ============ MIDDLEWARE (ORDER MATTERS!) ============

// 1. CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mybigyard.com',
    'https://www.mybigyard.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Body parser - SKIP for multipart/form-data routes
app.use((req, res, next) => {
  // Skip JSON parsing for image upload routes
  if (req.path.includes('/images') && req.method === 'POST') {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 3. Initialize Passport BEFORE routes
app.use(passport.initialize());

// ============ ROUTES (Register each ONCE) ============

app.use("/api/auth", authRoutes);
app.use("/api/host/listings", hostListingRoutes);
app.use("/api/host/dashboard", hostDashboardRoutes);
app.use("/api/host/reviews", hostReviewRoutes);
app.use("/api/publicListings", publicListingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/discover", discoveryRoutes);

import {
  tierPublicRoutes,
  hostSubscriptionRoutes,
  paymentRoutes,
  paymentCallbackRoutes,
  adminTierRoutes,
} from "./routes/tierRoutes.js";

// Public tier info (no auth)
app.use("/api/public", tierPublicRoutes);

// Host subscription management
app.use("/api/host/tier", hostSubscriptionRoutes);

// Payment routes
app.use("/api/payments", paymentRoutes);

// Payment callbacks (called by gateways)
app.use("/api/payments/callback", paymentCallbackRoutes);

// Admin tier management
app.use("/api/admin/tiers", adminTierRoutes);

// Blog Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/user/blogs", userBlogRoutes);
app.use("/api/host/blogs", hostBlogRoutes);
app.use("/api/admin/blogs", adminBlogRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hello! myBigYard Server is working. 🏡");
});

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
});