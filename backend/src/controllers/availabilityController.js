import * as availabilityService from "../services/availabilityService.js";

/**
 * Get availability for a listing
 * GET /api/availability/:listingId
 */
export async function getAvailability(req, res) {
  try {
    const listingId = Number(req.params.listingId);

    if (!listingId || isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const availability = await availabilityService.getAvailabilityByListingId(listingId);
    res.json(availability);
  } catch (err) {
    console.error("GET AVAILABILITY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Create new availability dates
 * POST /api/availability/:listingId
 */
export async function createAvailability(req, res) {
  try {
    const listingId = Number(req.params.listingId);
    const { dates } = req.body;

    if (!listingId || isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Invalid dates array" });
    }

    const availability = await availabilityService.createAvailabilityDates(listingId, dates);
    res.json(availability);
  } catch (err) {
    console.error("CREATE AVAILABILITY ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Toggle availability for a specific date
 * POST /api/availability/toggle
 */
export async function toggleAvailability(req, res) {
  try {
    const { listingId, date } = req.body;

    if (!listingId || !date) {
      return res.status(400).json({ error: "listingId and date are required" });
    }

    const result = await availabilityService.toggleAvailability(listingId, date);
    res.json(result);
  } catch (err) {
    console.error("TOGGLE AVAILABILITY ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get blocked dates for a listing
 * GET /api/availability/:listingId/blocked
 */
export async function getBlockedDates(req, res) {
  try {
    const listingId = Number(req.params.listingId);

    if (!listingId || isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const blockedDates = await availabilityService.getBlockedDates(listingId);
    res.json(blockedDates);
  } catch (err) {
    console.error("GET BLOCKED DATES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}