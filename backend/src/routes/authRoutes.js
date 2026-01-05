import express from "express";
import passport from "../config/passport.js";
import { authenticate } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import * as userManagementController from "../controllers/userManagementController.js";
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
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`
  }),
  authController.googleCallback
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