import * as publicListingService from "../services/publicListingService.js";

/**
 * Get all public listings with optional filters
 * GET /api/publicListings
 */
export async function getListings(req, res) {
  try {
    const filters = {
      location: req.query.location,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
    };

    const listings = await publicListingService.getPublicListings(filters);
    res.json(listings);
  } catch (err) {
    console.error("GET PUBLIC LISTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get a single public listing by ID
 * GET /api/publicListings/:id
 */
export async function getListingById(req, res) {
  try {
    const listingId = Number(req.params.id);
    if (isNaN(listingId)) return res.status(400).json({ error: "Invalid listing ID" });

    const listing = await publicListingService.getPublicListingById(listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Get booked slots (availability)
    const bookedSlots = await availabilityService.getBookedSlots(listingId);

    res.json({ ...listing, bookedSlots });
  } catch (err) {
    console.error("GET PUBLIC LISTING ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}


/**
 * Get featured listings
 * GET /api/publicListings/featured
 */
export async function getFeaturedListings(req, res) {
  try {
    const limit = Number(req.query.limit) || 6;
    const listings = await publicListingService.getFeaturedListings(limit);
    res.json(listings);
  } catch (err) {
    console.error("GET FEATURED LISTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Search listings
 * GET /api/publicListings/search
 */
export async function searchListings(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const listings = await publicListingService.searchListings(q.trim());
    res.json(listings);
  } catch (err) {
    console.error("SEARCH LISTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get listings by location
 * GET /api/publicListings/location/:location
 */
export async function getListingsByLocation(req, res) {
  try {
    const { location } = req.params;

    if (!location || location.trim().length === 0) {
      return res.status(400).json({ error: "Location is required" });
    }

    const listings = await publicListingService.getListingsByLocation(location.trim());
    res.json(listings);
  } catch (err) {
    console.error("GET LISTINGS BY LOCATION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}