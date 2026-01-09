import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { validateRegistration, validateLogin } from "../validators/auth.validator.js";
import emailService from "../services/email/emailService.js";
import crypto from "crypto";
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
 * NOW WITH COUNTRY FIELD
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "USER", country } = req.body;

    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors[0],
        errors: validation.errors 
      });
    }

    // Validate country (optional but recommended)
    if (country && typeof country !== "string") {
      return res.status(400).json({ error: "Invalid country format" });
    }

    // Country should be ISO 3166-1 alpha-2 code (e.g., "NP", "US")
    if (country && country.length !== 2) {
      return res.status(400).json({ error: "Country must be a 2-letter country code" });
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

    // Create user WITH COUNTRY
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "HOST" ? "HOST" : "USER",
        emailVerified: false,
        country: country?.toUpperCase() || null, // Store as uppercase
      },
    });

    console.log("✅ User created:", { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      country: user.country,
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
        country: user.country, // Include country in response
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
 * Login - Include country in response
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
        country: user.country, // Include country
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Get current user - Include country
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
        country: true, // Include country
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

    if (!user) {
      console.error("❌ No user returned from Google OAuth");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
    }

    console.log("🔍 User from passport:", {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      googleId: user.googleId
    });

    const token = generateToken(user);
    
    // ✅ For Google OAuth, emailVerified should ALWAYS be true
    const params = new URLSearchParams({
      token,
      userId: user.id.toString(),
      name: encodeURIComponent(user.name || ""),
      email: encodeURIComponent(user.email),
      role: user.role,
      emailVerified: "true", // ✅ FORCE to "true" for all Google users
      phoneVerified: user.phoneVerified ? "true" : "false",
    });
    
    console.log("✅ Google OAuth redirect params:", Object.fromEntries(params));
    
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (error) {
    console.error("❌ Google callback error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
  }
};

// Forgot password routes
export async function forgotPassword(req,res){
  try{
    const {email}= req.body;

    if(!email){
      return res.status(400).json({
        error:"Email is required"});
      }

      //Find user by email
      const user = await prisma.user.findUnique({
        where:{email:email.toLowerCase().trim()}
      });

      //Always return success to prevent email enumeration
      //(Don't reveal if email exists or not)
      if(!user){
        return res.json({
          message:"If the email exists, a password reset link has been sent"
        })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now()+60*60*1000)// 1 hour

      // Hash token before storing (security best practice)
      const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");
      
      // Save token to database
      await prisma.user.update({
        where:{id:user.id},
        data:{
          resetPasswordToken:hashedToken,
          resetPasswordExpires:resetTokenExpiry,
        }
      })  
      
      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

      // Send email
      await emailService.sendPasswordResetEmail(user.email,user.name,resetUrl);

      res.json({
        message:"If the email exists, a password reset link has been sent",
      })
  
    }catch(error){
      console.error("FORGOT PASSWORD ERROR ",error);
      res.status(500).json({error:"Failed to process request"});
    }
}

// Verify reset token
export async function verifyResetToken(req,res){
  try{
    const{token} = req.params;

    if(!token){
      return res.status(400).json({error:"Token is required"})
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(), // Token not expired
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
        valid: false,
      });
    }

    res.json({
      valid: true,
      email: user.email,
    });

  }catch (error){
    console.error("VERIFY TOKEN ERROR: ",error);
    res.status(500).json({error:"Failed to verify token"})
  }
}

// Reset password
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({
        error: "Password must be less than 128 characters",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }
    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
}
