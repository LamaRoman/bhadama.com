import * as publicListingService from "../services/public.listing.service.js";
import { prisma } from '../config/prisma.config.js';

/**
 * Get availability for a listing
 * GET /api/publicListings/:id/availability
 */
export const getAvailability = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    if (isNaN(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        listingId: listingId,
        status: 'COMPLETED',
      },
      select: {
        bookingDate: true
      }
    });

    const unavailableDates = bookings.map(b => b.bookingDate.toISOString().split('T')[0]);

    res.json({
      success: true,
      unavailableDates
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all public listings with optional filters and pagination
 * GET /api/publicListings?search=wedding&page=1&limit=20&sortBy=price_low
 */
export async function getListings(req, res) {
  try {
    const filters = {
      location: req.query.location,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      amenities: req.query.amenities,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await publicListingService.getPublicListings(filters);
    res.json(result);
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

    res.json(listing);
  } catch (err) {
    console.error("GET PUBLIC LISTING ERROR:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get featured listings
 * GET /api/publicListings/featured?limit=6
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
 * Search listings with pagination
 * GET /api/publicListings/search?q=pool&page=1&limit=20
 */
export async function searchListings(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const result = await publicListingService.searchListings(q.trim(), { page, limit });
    res.json(result);
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
    const limit = Number(req.query.limit) || 20;

    if (!location || location.trim().length === 0) {
      return res.status(400).json({ error: "Location is required" });
    }

    const listings = await publicListingService.getListingsByLocation(location.trim(), limit);
    res.json(listings);
  } catch (err) {
    console.error("GET LISTINGS BY LOCATION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get all unique amenities for filters
 * GET /api/publicListings/amenities
 */
export async function getAmenities(req, res) {
  try {
    const amenities = await publicListingService.getAllAmenities();
    res.json({ amenities });
  } catch (err) {
    console.error("GET AMENITIES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}