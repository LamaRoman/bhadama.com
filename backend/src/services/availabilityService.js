import { prisma } from "../config/prisma.js";
import { parseLocalDate } from "../../utils/dateUtils.js";

/**
 * Get all availability records for a listing
 * @param {number} listingId - The listing ID
 * @returns {Promise<Array>} - Array of availability records
 */
export async function getAvailabilityByListingId(listingId) {
  return prisma.availability.findMany({
    where: { listingId },
    orderBy: { date: "asc" },
  });
}

/**
 * Create multiple availability dates for a listing
 * @param {number} listingId - The listing ID
 * @param {string[]} dates - Array of date strings (YYYY-MM-DD)
 * @returns {Promise<Array>} - Updated availability records
 */
export async function createAvailabilityDates(listingId, dates) {
  const parsedDates = dates.map((d) => {
    const localDate = parseLocalDate(d);
    return { 
      listingId, 
      date: localDate,
      isAvailable: true 
    };
  });

  await prisma.availability.createMany({
    data: parsedDates,
    skipDuplicates: true,
  });

  return getAvailabilityByListingId(listingId);
}

/**
 * Toggle availability status for a specific date
 * @param {number} listingId - The listing ID
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>} - Result with message and availability record
 */
export async function toggleAvailability(listingId, dateStr) {
  const localDate = parseLocalDate(dateStr);

  // Check if record exists
  const existing = await prisma.availability.findFirst({
    where: {
      listingId: Number(listingId),
      date: localDate,
    },
  });

  // If no record exists, create as unavailable (blocked)
  if (!existing) {
    const newRecord = await prisma.availability.create({
      data: {
        listingId: Number(listingId),
        date: localDate,
        isAvailable: false,
      },
    });

    return {
      message: "Date blocked",
      availability: newRecord,
    };
  }

  // If exists, toggle isAvailable
  const updated = await prisma.availability.update({
    where: { id: existing.id },
    data: { isAvailable: !existing.isAvailable },
  });

  return {
    message: updated.isAvailable ? "Date unblocked" : "Date blocked",
    availability: updated,
  };
}

/**
 * Check if a specific date is available for a listing
 * @param {number} listingId - The listing ID
 * @param {Date} date - Date to check
 * @returns {Promise<boolean>} - True if available
 */
export async function isDateAvailable(listingId, date) {
  const record = await prisma.availability.findFirst({
    where: { listingId, date },
  });

  // If no record exists, date is considered available
  if (!record) return true;

  return record.isAvailable;
}

/**
 * Mark a date as unavailable (booked)
 * @param {Object} tx - Prisma transaction client
 * @param {number} listingId - The listing ID
 * @param {Date} date - Date to mark as unavailable
 * @returns {Promise<Object>} - Availability record
 */
export async function markDateAsBooked(tx, listingId, date) {
  let availRecord = await tx.availability.findFirst({
    where: { listingId, date },
  });

  if (!availRecord) {
    // Create new availability record as booked
    return tx.availability.create({
      data: { listingId, date, isAvailable: false },
    });
  }

  if (!availRecord.isAvailable) {
    throw new Error(`Date not available: ${date.toISOString().split("T")[0]}`);
  }

  // Mark existing record as booked
  return tx.availability.update({
    where: { id: availRecord.id },
    data: { isAvailable: false },
  });
}

/**
 * Get blocked dates for a listing
 * @param {number} listingId - The listing ID
 * @returns {Promise<Array>} - Array of blocked availability records
 */
export async function getBlockedDates(listingId) {
  return prisma.availability.findMany({
    where: { 
      listingId,
      isAvailable: false 
    },
    orderBy: { date: "asc" },
  });
}