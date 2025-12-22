import { prisma } from "../config/prisma.js";

/**
 * Get booked time slots for a listing on a specific date
 * @param {number} listingId - The listing ID
 * @param {Date} date - The date to check (optional, defaults to today)
 * @returns {Promise<Array>} - Array of booked slots
 */
export async function getBookedSlots(listingId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      bookingDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["CONFIRMED", "PENDING"],
      },
    },
    select: {
      id: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      status: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return bookings;
}

/**
 * Get all booked dates for a listing (for calendar display)
 * @param {number} listingId - The listing ID
 * @param {Date} startDate - Start date for range
 * @param {Date} endDate - End date for range
 * @returns {Promise<Array>} - Array of dates with booking counts
 */
export async function getBookedDates(listingId, startDate, endDate) {
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      bookingDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["CONFIRMED", "PENDING"],
      },
    },
    select: {
      bookingDate: true,
      startTime: true,
      endTime: true,
    },
  });

  // Group by date
  const dateMap = new Map();
  
  bookings.forEach((booking) => {
    const dateKey = booking.bookingDate.toISOString().split("T")[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey).push({
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
  });

  return Array.from(dateMap.entries()).map(([date, slots]) => ({
    date,
    bookingCount: slots.length,
    slots,
  }));
}

/**
 * Check if a time slot is available
 * @param {number} listingId - The listing ID
 * @param {Date} bookingDate - The date to check
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @returns {Promise<boolean>} - True if available, false if booked
 */
export async function isSlotAvailable(listingId, bookingDate, startTime, endTime) {
  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all bookings for that day
  const existingBookings = await prisma.booking.findMany({
    where: {
      listingId,
      bookingDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["CONFIRMED", "PENDING"],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Check for time conflicts
  for (const booking of existingBookings) {
    if (timesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
      return false;
    }
  }

  return true;
}

/**
 * Get blocked dates for a listing
 * @param {number} listingId - The listing ID
 * @returns {Promise<Array>} - Array of blocked dates
 */
export async function getBlockedDates(listingId) {
  return prisma.blockedDate.findMany({
    where: {
      listingId,
      date: {
        gte: new Date(),
      },
    },
    orderBy: {
      date: "asc",
    },
  });
}

/**
 * Block a date for a listing
 * @param {number} listingId - The listing ID
 * @param {Date} date - The date to block
 * @param {string} reason - Reason for blocking (optional)
 * @returns {Promise<Object>} - The blocked date record
 */
export async function blockDate(listingId, date, reason = null) {
  return prisma.blockedDate.create({
    data: {
      listingId,
      date,
      reason,
    },
  });
}

/**
 * Unblock a date
 * @param {number} blockedDateId - The blocked date ID
 * @returns {Promise<Object>} - The deleted record
 */
export async function unblockDate(blockedDateId) {
  return prisma.blockedDate.delete({
    where: {
      id: blockedDateId,
    },
  });
}

/**
 * Get availability summary for a listing
 * @param {number} listingId - The listing ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Availability summary
 */
export async function getAvailabilitySummary(listingId, startDate, endDate) {
  const [bookedDates, blockedDates] = await Promise.all([
    getBookedDates(listingId, startDate, endDate),
    getBlockedDates(listingId),
  ]);

  return {
    bookedDates,
    blockedDates,
  };
}

// Helper function to check if two time ranges overlap
function timesOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// In availabilityService.js - modify getBookedDates or create a new function
export async function getCalendarAvailability(listingId, startDate, endDate) {
  const [bookings, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId,
        bookingDate: { gte: startDate, lte: endDate },
        status: { in: ["CONFIRMED", "PENDING"] }
      },
      select: { bookingDate: true }
    }),
    prisma.blockedDate.findMany({
      where: {
        listingId,
        date: { gte: startDate, lte: endDate }
      }
    })
  ]);
  
  // Convert to date strings for easy comparison
  const bookedDateStrs = bookings.map(b => b.bookingDate.toISOString().split('T')[0]);
  const blockedDateStrs = blockedDates.map(b => b.date.toISOString().split('T')[0]);
  
  // Generate response
  const availability = {};
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    availability[dateStr] = {
      available: !bookedDateStrs.includes(dateStr) && !blockedDateStrs.includes(dateStr),
      status: bookedDateStrs.includes(dateStr) ? "booked" : 
              blockedDateStrs.includes(dateStr) ? "blocked" : "available"
    };
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return availability;
}
// Convert HH:MM to minutes since midnight
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}