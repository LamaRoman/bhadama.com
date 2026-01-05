import { prisma } from "../config/prisma.js";
import { validateRoleChange, validateUserSearch, validatePagination } from "../validators/user.validator.js";

/**
 * Change user role (Admin/Moderator only)
 */
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