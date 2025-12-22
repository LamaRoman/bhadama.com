// server.js or app.js
import express from "express";
import 'dotenv/config';
import cors from "cors";

import authRoutes from "./routes/auth.js";
import hostListingRoutes from "./routes/hostListingRoutes.js";
import publicListingRoutes from "./routes/publicListingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { completeExpiredBookings } from "./controllers/bookingController.js";
const app = express();


// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
completeExpiredBookings(); // run once at startup

setInterval(async () => {
  try {
    await completeExpiredBookings();
  } catch (err) {
    console.error("❌ Booking completion job failed:", err);
  }
}, 5 * 60 * 1000);
app.use((req, res, next) => {
  console.log("Incoming body:", req.body);
  next();
});

// Routes - Register each only ONCE
app.use("/api/auth", authRoutes);
app.use("/api/host/listings", hostListingRoutes);
app.use("/api/publicListings", publicListingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes); // ← ONLY ONCE!
app.use('/api/admin', adminRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("Hello! myBigYard Server is working. 🏡");
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});