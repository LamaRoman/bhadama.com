import * as availabilityService from "../services/availabilityService.js";
import { prisma } from "../config/prisma.js";

/**
 * Get availability for a listing
 * GET /api/availability/:listingId
 */
export async function getAvailability(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const bookedSlots = await availabilityService.getBookedSlots(listingId, date);
    const blockedDates = await availabilityService.getBlockedDates(listingId);

    res.json({
      date: date.toISOString().split("T")[0],
      bookedSlots,
      blockedDates,
    });
  } catch (error) {
    console.error("GET AVAILABILITY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check if a specific time slot is available
 * POST /api/availability/check
 */
export async function checkSlotAvailability(req, res) {
  try {
    const { listingId, bookingDate, startTime, endTime } = req.body;

    if (!listingId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isAvailable = await availabilityService.isSlotAvailable(
      parseInt(listingId),
      new Date(bookingDate),
      startTime,
      endTime
    );

    res.json({ available: isAvailable });
  } catch (error) {
    console.error("CHECK SLOT AVAILABILITY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get booked dates for a date range (calendar view)
 * GET /api/availability/:listingId/dates
 */
export async function getBookedDates(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);

    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date();

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // ✅ FIX: normalize dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const [bookings, blockedDates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          listingId,
          bookingDate: { gte: startDate, lte: endDate },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: { bookingDate: true },
      }),
      prisma.blockedDate.findMany({
        where: {
          listingId,
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const availability = {};
    const currentDate = new Date(startDate);

    const bookedDateStrs = bookings.map(b =>
      b.bookingDate.toISOString().split("T")[0]
    );
    const blockedDateStrs = blockedDates.map(b =>
      b.date.toISOString().split("T")[0]
    );

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const isBooked = bookedDateStrs.includes(dateStr);
      const isBlocked = blockedDateStrs.includes(dateStr);

      availability[dateStr] = {
        available: !isBooked && !isBlocked,
        status: isBooked ? "booked" : isBlocked ? "blocked" : "available",
        price: 150,
        minNights: 1,
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      listingId,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      availability,
    });
  } catch (error) {
    console.error("GET BOOKED DATES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get availability summary
 * GET /api/availability/:listingId/summary
 */
export async function getAvailabilitySummary(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);

    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date();

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const summary = await availabilityService.getAvailabilitySummary(
      listingId,
      startDate,
      endDate
    );

    res.json(summary);
  } catch (error) {
    console.error("GET AVAILABILITY SUMMARY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Block a date
 * POST /api/availability/:listingId/block
 */
export async function blockDate(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const blockDate = new Date(date);
    blockDate.setHours(0, 0, 0, 0);

    const blockedDate = await availabilityService.blockDate(
      listingId,
      blockDate,
      reason
    );

    res.status(201).json(blockedDate);
  } catch (error) {
    console.error("BLOCK DATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Unblock a date
 * DELETE /api/availability/blocked/:blockedDateId
 */
export async function unblockDate(req, res) {
  try {
    const blockedDateId = parseInt(req.params.blockedDateId);

    const result = await availabilityService.unblockDate(blockedDateId);

    res.json({ message: "Date unblocked successfully", result });
  } catch (error) {
    console.error("UNBLOCK DATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ✅ FIXED Calendar Availability (LAST DAY BUG FIXED)
 * GET /api/availability/:listingId/calendar
 */
/**
 * ✅ FIXED Calendar Availability (TIMEZONE BUG FIXED)
 * GET /api/availability/:listingId/calendar
 */
export async function getCalendarAvailability(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    // ✅ Correct last day
    const lastDay = new Date(year, month, 0).getDate();

    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // ✅ Use local date for proper comparison
    const endDate = new Date(year, month - 1, lastDay);
    endDate.setHours(23, 59, 59, 999);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { operatingHours: true, minHours: true },
    });

    // ✅ FIX: Use local date string for comparisons
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // ✅ Get bookings
    const bookings = await prisma.booking.findMany({
      where: {
        listingId,
        bookingDate: { gte: startDate, lte: endDate },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: {
        bookingDate: true,
        startTime: true,
        endTime: true,
      },
    });

    // ✅ Get blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        listingId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const availability = {};
    const currentDate = new Date(startDate);

    // ✅ Pre-process blocked dates for faster lookup
    const blockedDateMap = {};
    blockedDates.forEach(b => {
      const dateKey = formatLocalDate(b.date);
      blockedDateMap[dateKey] = true;
    });

    // ✅ Pre-process bookings for faster lookup
    const bookingsByDate = {};
    bookings.forEach(b => {
      const dateKey = formatLocalDate(b.bookingDate);
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      bookingsByDate[dateKey].push({
        start: b.startTime,
        end: b.endTime,
      });
    });

    // ✅ Process each day of the month
    while (currentDate.getMonth() === month - 1) {
      const dateStr = formatLocalDate(currentDate);
      
      // ✅ Check if date is blocked
      if (blockedDateMap[dateStr]) {
        availability[dateStr] = {
          status: "blocked",
          available: false,
          fullyBooked: true,
        };
      } else {
        const dayOfWeek = currentDate.getDay();
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];

        const dayHours =
          listing?.operatingHours?.[dayNames[dayOfWeek]] || { closed: true };

        if (dayHours.closed) {
          availability[dateStr] = {
            status: "closed",
            available: false,
            fullyBooked: true,
          };
        } else {
          const dateBookings = bookingsByDate[dateStr] || [];

          if (dateBookings.length === 0) {
            availability[dateStr] = {
              status: "available",
              available: true,
              fullyBooked: false,
              bookedSlots: [],
              availableSlots: generateTimeSlotsForDay(
                dayHours.start,
                dayHours.end,
                listing?.minHours || 1
              ),
              availableCount: calculateAvailableCount(
                dayHours.start,
                dayHours.end,
                listing?.minHours || 1
              ),
              bookedCount: 0,
            };
          } else {
            const bookedRanges = dateBookings;

            const availableSlots = calculateAvailableSlots(
              dayHours.start,
              dayHours.end,
              bookedRanges,
              listing?.minHours || 1
            );

            availability[dateStr] = {
              status: availableSlots.length ? "partially-booked" : "fully-booked",
              available: availableSlots.length > 0,
              bookedSlots: bookedRanges,
              availableSlots,
              availableCount: availableSlots.length,
              bookedCount: bookedRanges.length,
            };
          }
        }
      }

      // ✅ Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ listingId, year, month, availability });
  } catch (error) {
    console.error("GET CALENDAR AVAILABILITY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= UPDATED HELPERS ================= */

function generateTimeSlotsForDay(startTime, endTime, minHours) {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  for (let t = start; t + 30 <= end; t += 30) {
    slots.push({
      start: formatMinutesToTime(t),
      end: formatMinutesToTime(t + 30),
    });
  }
  return slots;
}

function calculateAvailableCount(startTime, endTime, minHours) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slotDuration = 30; // 30-minute slots
  
  const totalSlots = Math.floor((end - start) / slotDuration);
  const minSlots = Math.ceil((minHours * 60) / slotDuration);
  
  // Count all possible slots
  let count = 0;
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    count++;
  }
  
  return count;
}

function calculateAvailableSlots(dayStart, dayEnd, bookedRanges, minHours) {
  const start = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);
  const minMinutes = minHours * 60;
  const slotDuration = 30; // 30-minute slots

  // Convert booked ranges to minutes and sort
  const booked = bookedRanges
    .map(r => ({ start: timeToMinutes(r.start), end: timeToMinutes(r.end) }))
    .sort((a, b) => a.start - b.start);

  // Find available time windows
  let cursor = start;
  const windows = [];

  for (const b of booked) {
    if (cursor < b.start && b.start - cursor >= minMinutes) {
      windows.push({ start: cursor, end: b.start });
    }
    cursor = Math.max(cursor, b.end);
  }

  if (cursor < end && end - cursor >= minMinutes) {
    windows.push({ start: cursor, end: end });
  }

  // Convert windows to 30-minute slots
  const slots = [];
  for (const w of windows) {
    for (let t = w.start; t + slotDuration <= w.end; t += slotDuration) {
      slots.push({
        start: formatMinutesToTime(t),
        end: formatMinutesToTime(t + slotDuration),
      });
    }
  }
  
  return slots;
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
/* ================= HELPERS ================= */

