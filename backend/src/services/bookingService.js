// services/bookingService.js
import { prisma } from "../config/prisma.js";

import { Decimal } from "@prisma/client/runtime/library"; // Add this import

// ... other imports

export async function createBooking(bookingData) {
  const { userId, listingId, bookingDate, startTime, endTime, guests, specialRequests } = bookingData;

  // 1. Validate listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      host: true,
      images: true
    }
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  // 2. Check time slot availability
  const hasConflict = await checkTimeConflict(listingId, bookingDate, startTime, endTime);
  if (hasConflict) {
    throw new Error("Time slot not available");
  }

  // 3. Validate guests count
  if (guests > listing.maxGuests) {
    throw new Error(`Maximum ${listing.maxGuests} guests allowed`);
  }

  if (guests < listing.minGuests) {
    throw new Error(`Minimum ${listing.minGuests} guests required`);
  }

  // 4. Calculate duration from startTime and endTime
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  const duration = (endMinutes - startMinutes) / 60; // Convert minutes to hours
  
  // Validate duration
  if (duration <= 0) {
    throw new Error("End time must be after start time");
  }
  
  if (duration < listing.minHours) {
    throw new Error(`Minimum booking duration is ${listing.minHours} hours`);
  }

  // 5. Calculate prices and convert to Decimal
  const hourlyRate = new Decimal(listing.hourlyRate || 0); // Fixed: use listing.hourlyRate, not listingId.hourlyRate
  const basePrice = hourlyRate.times(new Decimal(duration));
  
  // Calculate extra guest charges
  const includedGuests = listing.includedGuests || 10;
  const extraGuestCharge = new Decimal(listing.extraGuestCharge || 0);
  let extraGuestPrice = new Decimal(0);
  
  if (extraGuestCharge.greaterThan(0) && guests > includedGuests) {
    const extraGuests = guests - includedGuests;
    extraGuestPrice = extraGuestCharge.times(new Decimal(extraGuests)).times(new Decimal(duration));
  }

  // Calculate fees
  const serviceFee = basePrice.times(new Decimal(0.10));
  const tax = basePrice.plus(extraGuestPrice).plus(serviceFee).times(new Decimal(0.08));
  const totalPrice = basePrice.plus(extraGuestPrice).plus(serviceFee).plus(tax);

  // 6. Generate booking number
  const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // 7. Create booking with Decimal values
  const booking = await prisma.booking.create({
    data: {
      userId,
      listingId,
      bookingDate: new Date(bookingDate),
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
        select: { id: true, name: true, email: true }
      }
    },
  });

  return booking;
}
/**
 * Check if time slot has conflicts
 */
async function checkTimeConflict(listingId, bookingDate, startTime, endTime) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

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
  }

  return false; // No conflict
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
// FIX: Update parseTime function to handle invalid time strings
function parseTime(timeStr) {
  if (!timeStr || !timeStr.includes(':')) {
    console.error('Invalid time string:', timeStr);
    return 0; // Return 0 instead of NaN
  }
  
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  // Check if parsing resulted in valid numbers
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('Failed to parse time:', timeStr);
    return 0;
  }
  
  return hours * 60 + minutes;
}
/**
 * Get available time slots for a listing on a specific date
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
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "lowercase" });
  const dayHours = listing.operatingHours[dayName];

  if (dayHours.closed) {
    return [];
  }

  // Get existing bookings
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

  // Generate time slots (every hour from operating start to end)
  const slots = [];
  const startMinutes = parseTime(dayHours.start);
  const endMinutes = parseTime(dayHours.end);
  const minBookingMinutes = listing.minHours * 60;

  for (let time = startMinutes; time < endMinutes; time += 60) {
    const slotStart = formatTime(time);
    const slotEnd = formatTime(Math.min(time + 60, endMinutes));
    
    // Check if slot is available
    const isAvailable = !bookings.some(booking => {
      const bookingStart = parseTime(booking.startTime);
      const bookingEnd = parseTime(booking.endTime);
      return time >= bookingStart && time < bookingEnd;
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: isAvailable,
    });
  }

  return slots;
}

/**
 * Format minutes to HH:MM
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Get user's bookings
 */
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

/**
 * Get host's bookings
 */
export async function getHostBookings(hostId) {
  return prisma.booking.findMany({
    where: {
      listing: { hostId },
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

/**
 * Cancel booking
 */
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

/**
 * Get booking by ID
 */
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