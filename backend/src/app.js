import express from "express";
import 'dotenv/config';
import cors from "cors";

import authRoutes from "./routes/auth.js";
import hostListingRoutes from "./routes/hostListingRoutes.js";
import publicListingRoutes from "./routes/publicListingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // frontend origin
  credentials: true,               // allow cookies/credentials
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/host/listings", hostListingRoutes);
app.use("/api/publicListings", publicListingRoutes);
app.use("/api/availability", availabilityRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hello! myBigYard Server is working. 🏡");
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});