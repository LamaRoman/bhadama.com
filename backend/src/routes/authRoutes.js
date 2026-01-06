import express from "express";
import passport from "../config/passport.js";
import { authenticate } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import * as userManagementController from "../controllers/userManagementController.js";
import jwt from "jsonwebtoken"

const router = express.Router();

/* ==================== GOOGLE AUTH ==================== */

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get("/google", (req, res, next) => {
  const role = req.query.role || "USER";
  
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role
  })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user.id, 
          email: req.user.email, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Use FRONTEND_URL from environment
      const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
      
      // Build redirect URL with all user data
      const params = new URLSearchParams({
        token,
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      });

      const redirectUrl = `${FRONTEND_URL}/auth/callback?${params.toString()}`;
      
      console.log("🟢 [BACKEND] Redirecting to:", redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
    }
  }
);

/* ==================== EMAIL/PASSWORD AUTH ==================== */

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email/password
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/password
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/* ==================== ADMIN: ROLE MANAGEMENT ==================== */

/**
 * @route   PUT /api/auth/admin/change-role/:userId
 * @desc    Change user role (Admin/Moderator only)
 * @access  Private (Admin/Moderator)
 */
router.put("/admin/change-role/:userId", authenticate, userManagementController.changeUserRole);

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get users list for admin panel (Admin/Moderator only)
 * @access  Private (Admin/Moderator)
 */
router.get("/admin/users", authenticate, userManagementController.getUsersList);

export default router;