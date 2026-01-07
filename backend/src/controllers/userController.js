import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import { uploadToS3, deleteFromS3 } from "../config/s3.js";
import crypto from "crypto";

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
    const { name, email } = req.body;

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
 * Upload profile photo to AWS S3
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

    // Generate unique key for S3
    const extension = req.file.originalname.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    const key = `profiles/${userId}/${timestamp}-${uniqueId}.${extension}`;

    // Upload to S3
    const { secure_url } = await uploadToS3(
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
      key
    );

    // Delete old photo from S3 if it exists
    if (currentUser.profilePhoto && currentUser.profilePhoto.includes('amazonaws.com')) {
      try {
        // Extract the S3 key from the URL
        const parts = currentUser.profilePhoto.split('.amazonaws.com/');
        
        if (parts.length === 2) {
          const oldKey = decodeURIComponent(parts[1]);
          await deleteFromS3(oldKey);
        }
      } catch (deleteErr) {
        console.error("Failed to delete old photo:", deleteErr.message);
        // Continue anyway - don't fail the upload if delete fails
      }
    }

    // Update user with new photo URL
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: secure_url },
    });

    res.json({
      message: "Profile photo uploaded successfully",
      photoUrl: secure_url,
    });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err);
    res.status(500).json({ error: "Failed to upload photo" });
  }
}

/**
 * Remove profile photo from AWS S3
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

    // Delete from S3 if it's an S3 URL
    if (currentUser.profilePhoto.includes('amazonaws.com')) {
      try {
        const parts = currentUser.profilePhoto.split('.amazonaws.com/');
        
        if (parts.length === 2) {
          const key = decodeURIComponent(parts[1]);
          await deleteFromS3(key);
        }
      } catch (deleteErr) {
        console.error("Failed to delete photo from S3:", deleteErr);
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
        email: true, // Optional: for logging purposes
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

    // Delete profile photo from S3 if exists
    if (user.profilePhoto && user.profilePhoto.includes('amazonaws.com')) {
      try {
        const parts = user.profilePhoto.split('.amazonaws.com/');
        if (parts.length === 2) {
          const key = decodeURIComponent(parts[1]);
          await deleteFromS3(key);
        }
      } catch (deleteErr) {
        console.error("Failed to delete photo from S3:", deleteErr);
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