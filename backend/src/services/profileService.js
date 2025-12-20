import { prisma } from "../config/prisma.js";

/**
 * Get user profile by ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object|null>} - User profile or null
 */
export async function getProfileById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

/**
 * Update user profile
 * @param {number} userId - The user ID
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} - Updated user profile
 */
export async function updateProfile(userId, data) {
  const { name, email } = data;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error("Email is already in use");
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

/**
 * Get user statistics
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} - User statistics
 */
export async function getUserStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      _count: {
        select: {
          bookings: true,
          listings: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    role: user.role,
    totalBookings: user._count.bookings,
    totalListings: user._count.listings,
  };
}