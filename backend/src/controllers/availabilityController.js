import * as availabilityService from "../services/availabilityService.js";

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
 * Get booked dates for a date range (for calendar view)
 * GET /api/availability/:listingId/dates
 */
export async function getBookedDates(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    const bookedDates = await availabilityService.getBookedDates(
      listingId,
      startDate,
      endDate
    );

    res.json(bookedDates);
  } catch (error) {
    console.error("GET BOOKED DATES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get availability summary for a date range
 * GET /api/availability/:listingId/summary
 */
export async function getAvailabilitySummary(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
 * Block a date (HOST only)
 * POST /api/availability/:listingId/block
 */
export async function blockDate(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const blockedDate = await availabilityService.blockDate(
      listingId,
      new Date(date),
      reason
    );

    res.status(201).json(blockedDate);
  } catch (error) {
    console.error("BLOCK DATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Unblock a date (HOST only)
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