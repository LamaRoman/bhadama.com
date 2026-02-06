// ==========================================
// BOOKING SERVICE - FIXED VERSION
// ==========================================
// File: services/booking.service.js
//
// FIXES APPLIED:
// 1. ✅ Synced tax rate to 5% (was 8%, now matches controller)
// 2. ✅ parseTime throws error instead of returning 0 for invalid input
// 3. ✅ Added better error handling
// ==========================================

import { prisma } from "../config/prisma.config.js";
import { Decimal } from "@prisma/client/runtime/library";

// ==========================================
// CONSTANTS - Centralized fee configuration
// ==========================================
const FEES = {
  SERVICE_FEE_RATE: 0.1,  // 10% service fee
  TAX_RATE: 0.05,         // 5% tax (synced with controller)
};

// ==========================================
// TIME UTILITIES
// ==========================================

/**
 * Parse time string (HH:MM) to minutes since midnight
 * ✅ FIX: Throws error instead of returning 0 for invalid input
 */
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error(`Invalid time string: ${timeStr} (expected string in HH:MM format)`);
  }

  if (!timeStr.includes(":")) {
    throw new Error(`Invalid time format: ${timeStr} (expected HH:MM format)`);
  }

  const parts = timeStr.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${timeStr} (expected HH:MM format)`);
  }

  const [hours, minutes] = parts.map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Failed to parse time: ${timeStr} (hours or minutes is NaN)`);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values: ${timeStr} (hours: 0-23, minutes: 0-59)`);
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes to HH:MM
 */
function formatTime(minutes) {
  if (minutes < 0 || minutes > 24 * 60) {
    throw new Error(`Invalid minutes value: ${minutes}`);
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Day names mapping (0 = Sunday)
 */
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// ==========================================
// GET AVAILABLE TIME SLOTS
// ==========================================

/**
 * Get available time slots for a listing on a specific date
 * Handles 24-hour venues, closed days, and existing bookings
 * 
 * @param {number} listingId - The listing ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of { startTime, endTime, available } objects
 */
export async function getAvailableTimeSlots(listingId, date) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      operatingHours: true,
      minHours: true,
    },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  // Get day of week
  const dateObj = new Date(date);
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  const dayOfWeek = dateObj.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  
  // Get operating hours for this day
  const dayHours = listing.operatingHours?.[dayName];

  // Handle missing operating hours (default to closed)
  if (!dayHours) {
    return [];
  }

  // Handle closed days
  if (dayHours.closed) {
    return [];
  }

  // Get existing bookings for this date
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      bookingDate: dateObj,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
    orderBy: { startTime: "asc" },
  });

  // Determine operating hours range
  let startMinutes, endMinutes;

  if (dayHours.is24Hours) {
    // 24-hour operation: 00:00 to 24:00 (midnight to midnight)
    startMinutes = 0;         // 00:00
    endMinutes = 24 * 60;     // 24:00 (end of day)
  } else {
    // Regular hours - with try/catch for better error handling
    try {
      startMinutes = parseTime(dayHours.start);
      endMinutes = parseTime(dayHours.end);
    } catch (error) {
      console.error(`Error parsing operating hours for ${dayName}:`, error.message);
      return [];
    }
    
    // Validate times
    if (endMinutes <= startMinutes) {
      console.error(`Invalid operating hours for ${dayName}: ${dayHours.start} - ${dayHours.end}`);
      return [];
    }
  }

  // Generate time slots (every hour)
  const slots = [];
  const slotDuration = 60; // 60 minutes per slot

  for (let time = startMinutes; time < endMinutes; time += slotDuration) {
    const slotStart = formatTime(time);
    const slotEnd = formatTime(Math.min(time + slotDuration, endMinutes));

    // Check if slot overlaps with any existing booking
    const isBooked = bookings.some((booking) => {
      try {
        const bookingStart = parseTime(booking.startTime);
        const bookingEnd = parseTime(booking.endTime);

        // Check for overlap
        return (
          (time >= bookingStart && time < bookingEnd) ||
          (time + slotDuration > bookingStart && time + slotDuration <= bookingEnd) ||
          (time <= bookingStart && time + slotDuration >= bookingEnd)
        );
      } catch (error) {
        console.error(`Error parsing booking times:`, error.message);
        return false; // Assume slot is available if we can't parse booking
      }
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked,
    });
  }

  return slots;
}

// ==========================================
// CREATE BOOKING
// ==========================================

export async function createBooking(bookingData) {
  const {
    userId,
    listingId,
    bookingDate,
    startTime,
    endTime,
    guests,
    specialRequests,
  } = bookingData;

  // 1. Validate listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      host: true,
      images: true,
    },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  // 2. Validate operating hours for the booking date
  const dateObj = new Date(bookingDate);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid booking date: ${bookingDate}`);
  }
  
  const dayOfWeek = dateObj.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = listing.operatingHours?.[dayName];

  if (!dayHours || dayHours.closed) {
    throw new Error("Venue is closed on this day");
  }

  // 3. Validate booking times against operating hours
  let bookingStartMinutes, bookingEndMinutes;
  
  try {
    bookingStartMinutes = parseTime(startTime);
    bookingEndMinutes = parseTime(endTime);
  } catch (error) {
    throw new Error(`Invalid booking times: ${error.message}`);
  }

  if (!dayHours.is24Hours) {
    try {
      const operatingStart = parseTime(dayHours.start);
      const operatingEnd = parseTime(dayHours.end);

      if (bookingStartMinutes < operatingStart || bookingEndMinutes > operatingEnd) {
        throw new Error(`Booking must be within operating hours (${dayHours.start} - ${dayHours.end})`);
      }
    } catch (error) {
      if (error.message.includes('operating hours')) {
        throw error;
      }
      throw new Error(`Invalid operating hours configuration: ${error.message}`);
    }
  }

  // 4. Check time slot availability
  const hasConflict = await checkTimeConflict(
    listingId,
    bookingDate,
    startTime,
    endTime
  );
  
  if (hasConflict) {
    throw new Error("Time slot not available");
  }

  // 5. Validate guests count
  if (listing.maxGuests && guests > listing.maxGuests) {
    throw new Error(`Maximum ${listing.maxGuests} guests allowed`);
  }

  if (listing.minGuests && guests < listing.minGuests) {
    throw new Error(`Minimum ${listing.minGuests} guests required`);
  }

  // 6. Calculate duration from startTime and endTime
  const duration = (bookingEndMinutes - bookingStartMinutes) / 60;

  // Validate duration
  if (duration <= 0) {
    throw new Error("End time must be after start time");
  }

  if (listing.minHours && duration < listing.minHours) {
    throw new Error(`Minimum booking duration is ${listing.minHours} hours`);
  }

  if (listing.maxHours && duration > listing.maxHours) {
    throw new Error(`Maximum booking duration is ${listing.maxHours} hours`);
  }

  // 7. Calculate prices using Decimal for precision
  // ✅ FIX: Using centralized FEES constant for consistency
  const hourlyRate = new Decimal(listing.hourlyRate || 0);
  const basePrice = hourlyRate.times(new Decimal(duration));

  // Calculate extra guest charges
  const includedGuests = listing.includedGuests || 10;
  const extraGuestCharge = new Decimal(listing.extraGuestCharge || 0);
  let extraGuestPrice = new Decimal(0);

  if (extraGuestCharge.greaterThan(0) && guests > includedGuests) {
    const extraGuests = guests - includedGuests;
    extraGuestPrice = extraGuestCharge
      .times(new Decimal(extraGuests))
      .times(new Decimal(duration));
  }

  // Calculate fees - ✅ FIX: Using FEES.TAX_RATE (5%) to match controller
  const subtotal = basePrice.plus(extraGuestPrice);
  const serviceFee = subtotal.times(new Decimal(FEES.SERVICE_FEE_RATE)); // 10%
  const tax = subtotal.times(new Decimal(FEES.TAX_RATE)); // 5% (was 8%, now synced)
  const totalPrice = subtotal.plus(serviceFee).plus(tax);

  // 8. Generate booking number
  const bookingNumber = `BK-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

  // 9. Create booking
  const booking = await prisma.booking.create({
    data: {
      userId,
      listingId,
      bookingDate: dateObj,
      startTime,
      endTime,
      duration: new Decimal(duration.toFixed(2)),
      guests,
      basePrice,
      extraGuestPrice,
      serviceFee,
      tax,
      totalPrice,
      specialRequests,
      bookingNumber,
      status: "CONFIRMED",
      paymentStatus: "pending",
    },
    include: {
      listing: {
        include: {
          images: { take: 1 },
          host: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return booking;
}

// ==========================================
// CHECK TIME CONFLICT
// ==========================================

/**
 * Check if time slot has conflicts with existing bookings
 */
async function checkTimeConflict(listingId, bookingDate, startTime, endTime) {
  let start, end;
  
  try {
    start = parseTime(startTime);
    end = parseTime(endTime);
  } catch (error) {
    throw new Error(`Invalid time format: ${error.message}`);
  }

  const existingBookings = await prisma.booking.findMany({
    where: {
      listingId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  for (const booking of existingBookings) {
    try {
      const existingStart = parseTime(booking.startTime);
      const existingEnd = parseTime(booking.endTime);

      // Check for overlap
      if (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      ) {
        return true; // Conflict found
      }
    } catch (error) {
      console.error(`Error parsing existing booking times:`, error.message);
      // Continue checking other bookings
    }
  }

  return false; // No conflict
}

// ==========================================
// GET USER BOOKINGS
// ==========================================

export async function getUserBookings(userId) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      listing: {
        include: {
          images: { where: { isCover: true }, take: 1 },
          host: {
            select: { id: true, name: true, email: true, profilePhoto: true },
          },
        },
      },
    },
    orderBy: { bookingDate: "desc" },
  });
}

// ==========================================
// GET HOST BOOKINGS
// ==========================================

export async function getHostBookings(hostId) {
  return prisma.booking.findMany({
    where: {
      listing: {
        hostId: Number(hostId),
      },
    },
    include: {
      listing: {
        include: {
          images: { where: { isCover: true }, take: 1 },
        },
      },
      user: {
        select: { id: true, name: true, email: true, profilePhoto: true },
      },
    },
    orderBy: { bookingDate: "desc" },
  });
}

// ==========================================
// CANCEL BOOKING
// ==========================================

export async function cancelBooking(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Check if user owns the booking or is the host
  if (booking.userId !== userId && booking.listing.hostId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
}

// ==========================================
// GET BOOKING BY ID
// ==========================================

export async function getBookingById(bookingId) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          images: true,
          host: {
            select: { id: true, name: true, email: true, profilePhoto: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true, profilePhoto: true },
      },
    },
  });
}