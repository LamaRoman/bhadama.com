import { prisma } from "../config/prisma.config.js";
import bcrypt from "bcrypt";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// Valid country codes (add more as needed)
const VALID_COUNTRY_CODES = [
  "NP", "IN", "US", "GB", "AU", "CA", "DE", "FR", "JP", "CN",
  "AE", "SG", "MY", "TH", "BD", "LK", "PK", "KR", "NL", "IT",
  "ES", "BR", "MX", "ZA", "NZ", "IE", "SE", "NO", "DK", "FI",
  "CH", "AT", "BE", "PT", "PL", "RU", "QA", "SA", "KW", "BH",
  "OM", "PH", "ID", "VN", "HK", "TW"
];

/**
 * Update user profile
 * PUT /api/users
 * NOW WITH COUNTRY FIELD
 */
export async function updateUser(req, res) {
  try {
    const userId = req.user.userId;
    const { name, email, phone, country } = req.body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};

    // Handle email update
    if (email && email !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      updateData.email = email;
      updateData.emailVerified = false; // Reset verification
    }

    // Handle name update (with 30-day cooldown)
    if (name && name !== currentUser.name) {
      if (currentUser.lastNameChange) {
        const daysSinceChange = Math.floor(
          (new Date() - new Date(currentUser.lastNameChange)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceChange < 30) {
          return res.status(400).json({
            error: `You can change your name again in ${30 - daysSinceChange} days`,
          });
        }
      }

      updateData.name = name;
      updateData.lastNameChange = new Date();
    }

    // Handle phone update
    if (phone !== undefined) {
      if (!phone || phone.trim() === '') {
        updateData.phone = null;
        updateData.phoneVerified = false;
        updateData.phoneCountryCode = null;
      } else if (phone !== currentUser.phone) {
        updateData.phone = phone;
        updateData.phoneVerified = false;
      }
    }

    // Handle country update (NEW)
    if (country !== undefined) {
      if (!country || country.trim() === '') {
        // Allow clearing country (though not recommended)
        updateData.country = null;
      } else {
        // Validate country code
        const countryCode = country.toUpperCase().trim();
        
        if (countryCode.length !== 2) {
          return res.status(400).json({ 
            error: "Country must be a 2-letter country code (e.g., NP, US, IN)" 
          });
        }

        if (!VALID_COUNTRY_CODES.includes(countryCode)) {
          return res.status(400).json({ 
            error: "Invalid country code. Please select a valid country." 
          });
        }

        updateData.country = countryCode;
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.json({
        message: "No changes to update",
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          profilePhoto: currentUser.profilePhoto,
          emailVerified: currentUser.emailVerified,
          phone: currentUser.phone,
          phoneVerified: currentUser.phoneVerified,
          country: currentUser.country,
        },
      });
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
        country: true,
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
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        phoneCountryCode: true,
        country: true, // Include country
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
    const result = await uploadToCloudinary(req.file, `profiles/${userId}`);

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
// ============================================================================
// USER MANAGEMENT CONTROLLERS (Admin)
// ============================================================================

export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.userId;

    // Validate input
    const validation = validateRoleChange(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors[0],
        errors: validation.errors 
      });
    }

    // Get the admin/moderator making the request
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, name: true }
    });

    // Check if requester is Admin or Moderator
    if (!admin || !["ADMIN", "MODERATOR"].includes(admin.role)) {
      return res.status(403).json({ error: "Unauthorized. Only Admin or Moderator can change roles." });
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
};

/**
 * Get users for role management (Admin/Moderator only)
 */
export const getUsersList = async (req, res) => {
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

    // Validate pagination
    const paginationValidation = validatePagination({ page, limit });
    if (!paginationValidation.isValid) {
      return res.status(400).json({ 
        error: paginationValidation.errors[0],
        errors: paginationValidation.errors 
      });
    }

    // Validate search
    const searchValidation = validateUserSearch({ search, role });
    if (!searchValidation.isValid) {
      return res.status(400).json({ 
        error: searchValidation.errors[0],
        errors: searchValidation.errors 
      });
    }

    const where = {
      role: { in: ["USER", "HOST"] }
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
};