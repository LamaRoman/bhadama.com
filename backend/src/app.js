// server.js
import express from "express";
import 'dotenv/config';
import cors from "cors";
import passport from "./config/passport.js";
import notificationRoutes from './routes/notificationRoutes.js'
// Import routes
import verificationRoutes from './routes/verificationRoutes.js';
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

import supportRoutes from "./routes/supportRoutes.js";

// Add with other routes

import {
  tierPublicRoutes,
  hostSubscriptionRoutes,
  paymentRoutes,
  paymentCallbackRoutes,
  adminTierRoutes,
} from "./routes/tierRoutes.js";

const app = express();

// ============ MIDDLEWARE (ORDER MATTERS!) ============

// 1. CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mybigyard.com',
    'https://www.mybigyard.com',
    'https://api.mybigyard.com'
     
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Body parser - Apply globally
// ✅ FIXED: Apply express.json() to ALL routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Note: For image uploads, use multer middleware in specific routes
// Multer will handle multipart/form-data and won't conflict with express.json()

// 3. Initialize Passport BEFORE routes
app.use(passport.initialize());

// ============ ROUTES (Register each ONCE) ============

app.use("/api/auth", authRoutes);
app.use('/api/verification', verificationRoutes);

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
app.use("/api/notifications",notificationRoutes)

app.use("/api/support",supportRoutes);

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
  console.log(`📧 Email verification: ${process.env.RESEND_API_KEY ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`📱 SMS verification (Nepal): ${process.env.SMS_NEPAL_PROVIDER || 'twilio'}`);
  console.log(`📱 SMS verification (International): ${process.env.SMS_INTERNATIONAL_PROVIDER || 'twilio'}`);
});