import express from "express";
import * as controller from "../controllers/publicListingController.js";

const router = express.Router();

// Get featured listings (must be before /:id to avoid conflict)
router.get("/featured", controller.getFeaturedListings);

// Search listings
router.get("/search", controller.searchListings);

// Get listings by location
router.get("/location/:location", controller.getListingsByLocation);

// Get all public listings with optional filters
router.get("/", controller.getListings);

// Get a single public listing by ID
router.get("/:id", controller.getListingById);

export default router;