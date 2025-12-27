import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import * as discoveryService from "../services/listingDiscoveryService.js";

const router = express.Router();

/**
 * GET /api/discover/homepage
 * Get all homepage sections in one call
 */
router.get("/homepage", async (req, res) => {
  try {
    const sections = await discoveryService.getHomepageSections();
    res.json(sections);
  } catch (error) {
    console.error("Homepage sections error:", error);
    res.status(500).json({ error: "Failed to fetch homepage sections" });
  }
});

/**
 * GET /api/discover/featured
 * Get featured listings
 */
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const listings = await discoveryService.getFeaturedListings(limit);
    res.json(listings);
  } catch (error) {
    console.error("Featured listings error:", error);
    res.status(500).json({ error: "Failed to fetch featured listings" });
  }
});

/**
 * GET /api/discover/discounted
 * Get discounted listings
 */
router.get("/discounted", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const listings = await discoveryService.getDiscountedListings(limit);
    res.json(listings);
  } catch (error) {
    console.error("Discounted listings error:", error);
    res.status(500).json({ error: "Failed to fetch discounted listings" });
  }
});

/**
 * GET /api/discover/trending
 * Get trending listings
 */
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const listings = await discoveryService.getTrendingListings(limit);
    res.json(listings);
  } catch (error) {
    console.error("Trending listings error:", error);
    res.status(500).json({ error: "Failed to fetch trending listings" });
  }
});

/**
 * GET /api/discover/new
 * Get new listings
 */
router.get("/new", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const listings = await discoveryService.getNewListings(limit);
    res.json(listings);
  } catch (error) {
    console.error("New listings error:", error);
    res.status(500).json({ error: "Failed to fetch new listings" });
  }
});

/**
 * GET /api/discover/promoted
 * Get promoted listings
 */
router.get("/promoted", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const listings = await discoveryService.getPromotedListings(limit);
    res.json(listings);
  } catch (error) {
    console.error("Promoted listings error:", error);
    res.status(500).json({ error: "Failed to fetch promoted listings" });
  }
});

/**
 * POST /api/discover/view/:listingId
 * Track listing view
 */
router.post("/view/:listingId", async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    await discoveryService.incrementViewCount(listingId);
    res.json({ success: true });
  } catch (error) {
    console.error("Track view error:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
});

/**
 * PUT /api/discover/admin/feature/:listingId
 * Admin: Set featured status
 */
router.put("/admin/feature/:listingId", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const { isFeatured, priority, durationDays } = req.body;
    const adminId = req.user.userId;

    const listing = await discoveryService.setFeaturedStatus({
      listingId,
      isFeatured,
      priority,
      durationDays,
      adminId
    });

    res.json({ success: true, listing });
  } catch (error) {
    console.error("Set featured error:", error);
    res.status(500).json({ error: "Failed to update featured status" });
  }
});

/**
 * PUT /api/discover/host/discount/:listingId
 * Host: Set discount on their listing
 */
router.put("/host/discount/:listingId", authenticate, async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const hostId = req.user.userId;
    const { discountPercent, discountReason, durationDays } = req.body;

    const listing = await discoveryService.setDiscount({
      listingId,
      hostId,
      discountPercent,
      discountReason,
      durationDays
    });

    res.json({ success: true, listing });
  } catch (error) {
    console.error("Set discount error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;