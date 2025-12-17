import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import userRoutes from "./routes/userRoutes.js"
// Import all routes
import {
  availabilityRoutes,
  bookingRoutes,
  hostListingRoutes,
  listingImageRoutes,
  profileRoutes,
  publicListingRoutes,
} from "./routes/index.js";
import authRoutes from "./routes/auth.js";



// Load environment variables
dotenv.config();

const app = express();
// ==================== CORS CONFIGURATION ==================== //

const allowedOrigins = ["http://localhost:3000", "http://localhost:5001"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
// ==================== SECURITY MIDDLEWARE ==================== //
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());



// ==================== BODY PARSING MIDDLEWARE ==================== //
// Parse JSON bodies (limit to prevent large payload attacks)
app.use(express.json({ limit: "10mb" }));
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/users",userRoutes)
// ==================== ROUTES ==================== //

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use("/api/publicListings", publicListingRoutes);

// Protected routes
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/host/listings", hostListingRoutes);
app.use("/api/listings", listingImageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);

// ==================== ERROR HANDLING ==================== //

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.status || 500).json({ error: message });
});

// ==================== SERVER ==================== //
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;