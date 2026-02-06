// routes/hostDashboardRoutes.js
import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { getHostDashboard } from "../controllers/host.dashboard.controller.js";

const router = express.Router();

// GET /api/host/dashboard - Get host dashboard data
router.get("/", 
  authenticate, 
  authorize({ minRole: "HOST" }), // ← Correct usage
  getHostDashboard
);

export default router;