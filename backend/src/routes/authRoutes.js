import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/authMiddleware.js";
import { AdminRole } from "@prisma/client";

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      adminRole: user.adminRole || null 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ==================== GOOGLE AUTH ==================== */

// Initiate Google OAuth - accepts role as query param
router.get("/google", (req, res, next) => {
  const role = req.query.role || "USER";
  
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role
  })(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);
      
      const params = new URLSearchParams({
        token,
        userId: user.id.toString(),
        name: user.name || "",
        email: user.email,
        role: user.role
      });
      
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
    }
  }
);

/* ==================== EMAIL/PASSWORD AUTH ==================== */

// Register with email/password
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "USER" } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "HOST" ? "HOST" : "USER"
      }
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login with email/password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(401).json({ 
        error: "This account uses Google sign-in. Please sign in with Google." 
      });
    }

    if (user.suspended) {
      return res.status(403).json({ 
        error: "Account suspended", 
        reason: user.suspendedReason 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole:user.adminRole,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        phone: true,
        createdAt: true,
        googleId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ...user,
      hasGoogleLinked: !!user.googleId
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/* ==================== ADMIN: ROLE MANAGEMENT ==================== */

// Change user role (Admin/Moderator only)
router.put("/admin/change-role/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.userId;

    // Get the admin/moderator making the request
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, name: true }
    });

    // Check if requester is Admin or Moderator
    if (!admin || !["ADMIN", "MODERATOR"].includes(admin.role)) {
      return res.status(403).json({ error: "Unauthorized. Only Admin or Moderator can change roles." });
    }

    // Validate new role
    const validRoles = ["USER", "HOST"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: "Invalid role. Must be USER or HOST." });
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent changing Admin/Moderator roles
    if (["ADMIN", "MODERATOR"].includes(targetUser.role)) {
      return res.status(403).json({ error: "Cannot change role of Admin or Moderator" });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminId,
        action: "USER_ROLE_CHANGED",
        entity: "User",
        entityId: parseInt(userId),
        before: { role: targetUser.role },
        after: { role: newRole }
      }
    });

    res.json({
      message: `User role changed from ${targetUser.role} to ${newRole}`,
      user: updatedUser
    });

  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({ error: "Failed to change user role" });
  }
});

// Get users for role management (Admin/Moderator only)
router.get("/admin/users", authenticate, async (req, res) => {
  try {
    const adminId = req.user.userId;

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || !["ADMIN", "MODERATOR"].includes(admin.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { search, role, page = 1, limit = 20 } = req.query;

    const where = {
      role: { in: ["USER", "HOST"] } // Only show USER and HOST, not ADMIN/MODERATOR
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    if (role && ["USER", "HOST"].includes(role)) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        createdAt: true,
        googleId: true,
        _count: {
          select: {
            listings: true,
            bookings: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

export default router;