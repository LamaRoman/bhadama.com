import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { validateRegistration, validateLogin } from "../validators/auth.validator.js";
import emailService from "../services/email/emailService.js";
import otpUtils from "../../utils/otpUtils.js";

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: Number(user.id),
      email: user.email,
      role: user.role,
      adminRole: user.adminRole || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Register new user with email/password
 * NOW WITH AUTO EMAIL VERIFICATION SENDING
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "USER" } = req.body;

    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors[0],
        errors: validation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.googleId && !existingUser.password) {
        return res.status(400).json({ 
          error: "An account with this email already exists. Please sign in with Google." 
        });
      }
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user WITHOUT OTP fields
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "HOST" ? "HOST" : "USER",
        emailVerified: false, // Important
      },
    });

    console.log("✅ User created in database:", { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      emailVerified: user.emailVerified 
    });

    // Generate JWT
    const token = generateToken(user);

    // Send response
    return res.status(201).json({
      message: "Registration successful! Please verify your email to continue.",
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });

  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({
      error: "Registration failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};


/**
 * Login user with email/password
 */
export const login = async (req, res) => {
  try {
       console.log('🔍 req.body:', req.body);
    console.log('🔍 email type:', typeof req.body?.email);
    const { email, password } = req.body;

    // Validate input
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors[0],
        errors: validation.errors 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Better message for Google-only accounts
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        error: "This account uses Google Sign-In. Please use the 'Sign in with Google' button." 
      });
    }

    if (user.suspended) {
      return res.status(403).json({ 
        error: "Account suspended", 
        reason: user.suspendedReason 
      });
    }

    // Extra check for password existence
    if (!user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
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
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRole: true,
        profilePhoto: true,
        phone: true,
        createdAt: true,
        googleId: true,
        emailVerified: true,
        phoneVerified: true,
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
    console.error("Get user error:", error.message);
    res.status(500).json({ error: "Failed to get user" });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = (req, res) => {
  try {
    const user = req.user; // From passport
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
    console.error("Google callback error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
  }
};