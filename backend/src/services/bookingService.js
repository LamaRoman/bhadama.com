import { prisma } from "../config/prisma.js";

// ============ HELPER FUNCTIONS ============

/**
 * Validate date format (YYYY-MM-DD)
 */
const isValidDateFormat = (dateStr) => {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
};

/**
 * Get end of day for a date
 */
const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// ============ SERVICE FUNCTIONS ============

export async function createBookings(listingId, userId, dates) {
  console.log("=== CREATE BOOKING START ===");
  console.log("listingId:", listingId);
  console.log("userId:", userId);
  console.log("dates:", dates);

  // Validate date formats
  for (const dateStr of dates) {
    if (!isValidDateFormat(dateStr)) {
      throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD`);
    }
  }

  // Sort dates
  const sortedDates = [...dates].sort();
  console.log("sortedDates:", sortedDates);

  const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0); // Noon to avoid TZ issues
};

// In createBookings:
const checkInDate = parseLocalDate(sortedDates[0]);
const lastNight = parseLocalDate(sortedDates[sortedDates.length - 1]);
const checkOutDate = new Date(lastNight);
checkOutDate.setDate(checkOutDate.getDate() + 1);

  console.log("checkInDate:", checkInDate);
  console.log("checkOutDate:", checkOutDate);

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Mark dates as unavailable
      for (const dateStr of sortedDates) {
        const date = parseLocalDate(dateStr);
        console.log("Marking date as booked:", dateStr);

        const existing = await tx.availability.findFirst({
          where: { listingId, date },
        });

        if (existing) {
          await tx.availability.update({
            where: { id: existing.id },
            data: { isAvailable: false },
          });
        } else {
          await tx.availability.create({
            data: {
              listingId,
              date,
              isAvailable: false,
            },
          });
        }
      }

      // Create booking
      console.log("Creating booking record...");
      return tx.booking.create({
        data: {
          listingId,
          userId,
          startDate: checkInDate,
          endDate: checkOutDate,
        },
      });
    });

    console.log("Booking created:", booking);
    console.log("=== CREATE BOOKING END ===");

    return {
      message: "Booking created successfully",
      booking,
    };
  } catch (err) {
    console.error("Transaction error:", err);
    throw err;
  }
}

// ... rest of your service functions (getBookingsByUserId, cancelBooking, etc.)
export async function getBookingsByUserId(userId) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          images: {
            take: 1,
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}