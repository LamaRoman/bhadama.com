import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { validateRegistration, validateLogin } from "../validators/auth.validator.js";

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
 */
export const register = async (req, res) => {
  try {
    console.log("📥 Registration request received:", { 
      email: req.body.email, 
      role: req.body.role 
    });

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
      console.log("❌ User already exists:", email);
      
      // Check if it's a Google-only account
      if (existingUser.googleId && !existingUser.password) {
        return res.status(400).json({ 
          error: "An account with this email already exists. Please sign in with Google." 
        });
      }
      
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed successfully");

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "HOST" ? "HOST" : "USER",
      },
    });
    console.log("✅ User created in database:", { 
      id: user.id.toString(), 
      email: user.email,
      role: user.role 
    });

    // Generate JWT
    const token = generateToken(user);
    console.log("🎫 JWT token generated");

    // Prepare response
    const responseData = {
      message: "Registration successful",
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    };

    console.log("📤 Sending response:", {
      status: 201,
      hasToken: !!responseData.token,
      userId: responseData.user.id
    });

    // Send JSON response
    return res.status(201).json(responseData);

  } catch (error) {
    console.error("❌ Register error:", error);
    console.error("Error stack:", error.stack);

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
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Login error:", error);
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
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = (req, res) => {
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
};