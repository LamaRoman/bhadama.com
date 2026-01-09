import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import crypto from "crypto";
import smsService from "../services/sms/smsService.js";

// ============ CONTROLLER FUNCTIONS ============

/**
 * Get user profile
 * GET /api/users/profile
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        lastNameChange: true,
        createdAt: true,
        // Email verification fields
        emailVerified: true,
        // Phone verification fields
        phone: true,
        phoneVerified: true,
        phoneCountryCode: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Update user profile
 * PUT /api/users
 */
export async function updateUser(req, res) {
  try {
    const userId = req.user.userId;
    const { name, email, phone } = req.body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = { email };

    // Check if name is being changed
    if (name && name !== currentUser.name) {
      // Check 30-day cooldown
      if (currentUser.lastNameChange) {
        const daysSinceChange = Math.floor(
          (new Date() - new Date(currentUser.lastNameChange)) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceChange < 30) {
          return res.status(400).json({
            error: `You can change your name again in ${
              30 - daysSinceChange
            } days`,
          });
        }
      }

      updateData.name = name;
      updateData.lastNameChange = new Date();
    }

    // Check if email is already taken by another user
    if (email !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      // Reset email verification if email changed
      updateData.emailVerified = false;
    }

    // Handle phone number update
    if (phone !== undefined) {
      // If phone is being cleared
      if (!phone || phone.trim() === '') {
        updateData.phone = null;
        updateData.phoneVerified = false;
        updateData.phoneCountryCode = null;
      } else {
        // Validate phone number format
        const phoneValidation = smsService.validatePhoneNumber(phone);
        
        if (!phoneValidation.valid) {
          return res.status(400).json({ 
            error: phoneValidation.error || "Invalid phone number format" 
          });
        }
        
        // Normalize phone number
        const normalizedPhone = smsService.normalizePhoneNumber(phone);
        
        // Check if phone changed
        if (normalizedPhone !== currentUser.phone) {
          // Check if phone is already used by another verified user
          const phoneExists = await prisma.user.findFirst({
            where: {
              phone: normalizedPhone,
              id: { not: userId },
              phoneVerified: true,
            },
          });

          if (phoneExists) {
            return res.status(400).json({ 
              error: "This phone number is already registered to another account" 
            });
          }

          updateData.phone = normalizedPhone;
          updateData.phoneVerified = false; // Reset verification when phone changes
          updateData.phoneCountryCode = phoneValidation.countryCode || null;
          
          // Clear any existing OTP data
          updateData.phoneVerificationToken = null;
          updateData.phoneVerificationExpiry = null;
          updateData.phoneVerificationAttempts = 0;
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        lastNameChange: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        phoneCountryCode: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

/**
 * Upload profile photo to Cloudinary
 * POST /api/users/upload-photo
 */
export async function uploadProfilePhoto(req, res) {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get current user to check if they have an old photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `profiles/${userId}`,
      public_id: `profile_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    });

    // Delete old photo from Cloudinary if it exists
    if (currentUser.profilePhoto && currentUser.profilePhoto.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = currentUser.profilePhoto.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicIdWithExtension);
      } catch (deleteErr) {
        console.error("Failed to delete old photo:", deleteErr.message);
        // Continue anyway - don't fail the upload if delete fails
      }
    }

    // Update user with new photo URL
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: result.secure_url },
    });

    res.json({
      message: "Profile photo uploaded successfully",
      photoUrl: result.secure_url,
    });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err);
    res.status(500).json({ error: "Failed to upload photo" });
  }
}

/**
 * Remove profile photo from Cloudinary
 * DELETE /api/users/remove-photo
 */
export async function removeProfilePhoto(req, res) {
  try {
    const userId = req.user.userId;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    if (!currentUser.profilePhoto) {
      return res.status(400).json({ error: "No profile photo to remove" });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (currentUser.profilePhoto.includes('cloudinary')) {
      try {
        const urlParts = currentUser.profilePhoto.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicIdWithExtension);
      } catch (deleteErr) {
        console.error("Failed to delete photo from Cloudinary:", deleteErr);
        // Continue anyway - still remove from database
      }
    }

    // Remove photo URL from database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    });

    res.json({ message: "Profile photo removed successfully" });
  } catch (err) {
    console.error("REMOVE PHOTO ERROR:", err);
    res.status(500).json({ error: "Failed to remove photo" });
  }
}

/**
 * Change password
 * PUT /api/users/change-password
 */
export async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    let { currentPassword, newPassword } = req.body;

    // Trim whitespace from passwords
    currentPassword = currentPassword?.trim();
    newPassword = newPassword?.trim();

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // Check minimum length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    // Check maximum length (prevent DoS attacks with very long passwords)
    if (newPassword.length > 128) {
      return res.status(400).json({
        error: "New password must be less than 128 characters",
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Optional: Log password change for security audit
    console.log(`Password changed successfully for user: ${user.email} (ID: ${userId})`);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
}

/**
 * Delete user account
 * DELETE /api/users
 */
export async function deleteUser(req, res) {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Delete profile photo from Cloudinary if exists
    if (user.profilePhoto && user.profilePhoto.includes('cloudinary')) {
      try {
        const urlParts = user.profilePhoto.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicIdWithExtension);
      } catch (deleteErr) {
        console.error("Failed to delete photo from Cloudinary:", deleteErr);
        // Continue with user deletion even if photo delete fails
      }
    }

    // Delete user (this will cascade delete bookings and listings)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
}