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

const app = express();

// ============ MIDDLEWARE (ORDER MATTERS!) ============

// 1. CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// 2. Body parser
app.use(express.json());

// 3. Initialize Passport BEFORE routes
app.use(passport.initialize());

// Debug logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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