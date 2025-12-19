// services/bookingService.js
import { prisma } from "../config/prisma.js";

/**
 * Create a new booking for hourly rental
 * @param {Object} bookingData - { userId, listingId, bookingDate, startTime, endTime, guests }
 */
export async function createBooking(bookingData) {
  const { userId, listingId, bookingDate, startTime, endTime, guests, specialRequests } = bookingData;

  // 1. Get listing details (HOURLY ONLY - removed halfDayRate and fullDayRate)
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      hourlyRate: true,
      minHours: true,
      maxHours: true,
      operatingHours: true,
      capacity: true,
      minCapacity: true,
      includedGuests: true,
      extraGuestCharge: true,
      status: true,
    },
  });

  if (!listing || listing.status !== "ACTIVE") {
    throw new Error("Listing not available");
  }

  // 2. Calculate duration in hours
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const duration = (end - start) / 60; // minutes to hours

  if (duration < listing.minHours) {
    throw new Error(`Minimum booking is ${listing.minHours} hours`);
  }

  if (duration > listing.maxHours) {
    throw new Error(`Maximum booking is ${listing.maxHours} hours`);
  }

  // 3. Check guest count
  if (guests < listing.minCapacity) {
    throw new Error(`Minimum ${listing.minCapacity} guest${listing.minCapacity > 1 ? 's' : ''} required`);
  }

  if (guests > listing.capacity) {
    throw new Error(`Maximum capacity is ${listing.capacity} guests`);
  }

  // 4. Check for time slot conflicts
  const hasConflict = await checkTimeConflict(listingId, bookingDate, startTime, endTime);
  if (hasConflict) {
    throw new Error("This time slot is already booked");
  }

  // 5. Calculate price (HOURLY ONLY)
  const basePrice = parseFloat(listing.hourlyRate) * duration;
  
  // Calculate extra guest charges
  let extraGuestPrice = 0;
  if (listing.extraGuestCharge && guests > listing.includedGuests) {
    const extraGuests = guests - listing.includedGuests;
    extraGuestPrice = parseFloat(listing.extraGuestCharge) * extraGuests * duration;
  }

  // Calculate fees (example: 10% service fee)
  const serviceFee = basePrice * 0.10;
  const tax = (basePrice + extraGuestPrice + serviceFee) * 0.08; // 8% tax

  const totalPrice = basePrice + extraGuestPrice + serviceFee + tax;

  // 6. Generate booking number
  const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // 7. Create booking (HOURLY ONLY - removed pricingType)
  const booking = await prisma.booking.create({
    data: {
      userId,
      listingId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      guests,
      basePrice,
      extraGuestPrice,
      serviceFee,
      tax,
      totalPrice,
      specialRequests,
      bookingNumber,
      status: "CONFIRMED",
      paymentStatus: "pending", // Will be updated after payment
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
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
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