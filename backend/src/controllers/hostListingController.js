import { prisma } from "../config/prisma.js";

/**
 * Create a new listing
 * POST /api/host/listings
 */

export const uploadImages = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const hostId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    // TEMP: just log to prove route works
    console.log("FILES:", req.files.length);

    res.status(201).json({
      message: "Images received",
      count: req.files.length,
    });
  } catch (error) {
    console.error("UPLOAD IMAGES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createListing = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      status,
      hourlyRate,
      halfDayRate,
      fullDayRate,
      minHours,
      maxHours,
      amenities,
      capacity,
      operatingHours
    } = req.body;
    
    const hostId = req.user.userId; // ← Fixed: JWT sets userId, not id

    // Validate at least one rate is provided
    if (!hourlyRate && !halfDayRate && !fullDayRate) {
      return res.status(400).json({ 
        error: "At least one pricing option (hourly, half-day, or full-day) is required" 
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        status: status || "ACTIVE",
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        halfDayRate: halfDayRate ? parseFloat(halfDayRate) : null,
        fullDayRate: fullDayRate ? parseFloat(fullDayRate) : null,
        minHours: minHours ? parseInt(minHours) : 2,
        maxHours: maxHours ? parseInt(maxHours) : 12,
        amenities: amenities || [],
        capacity: capacity ? parseInt(capacity) : null,
        operatingHours: operatingHours || null,
        price: hourlyRate ? parseFloat(hourlyRate) : 0, // Backward compatibility
        host: {
          connect: { id: hostId },
        },
      },
      include: {
        images: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error("CREATE LISTING ERROR:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all listings for the logged-in host
 * GET /api/host/listings
 */
export const getHostListings = async (req, res) => {
  try {
    const hostId = req.user.userId;

    const listings = await prisma.listing.findMany({
      where: { hostId },
      include: {
        images: true,
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(listings);
  } catch (error) {
    console.error("GET HOST LISTINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single listing by ID (host must own it)
 * GET /api/host/listings/:id
 */
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;

    const listing = await prisma.listing.findFirst({
      where: { 
        id: parseInt(id),
        hostId 
      },
      include: {
        images: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (error) {
    console.error("GET LISTING BY ID ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a listing
 * PUT /api/host/listings/:id
 */
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const { 
      title, 
      description, 
      location, 
      status,
      hourlyRate,
      halfDayRate,
      fullDayRate,
      minHours,
      maxHours,
      amenities,
      capacity,
      operatingHours
    } = req.body;

    // Check ownership
    const existing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        location,
        status,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        halfDayRate: halfDayRate ? parseFloat(halfDayRate) : null,
        fullDayRate: fullDayRate ? parseFloat(fullDayRate) : null,
        minHours: minHours ? parseInt(minHours) : undefined,
        maxHours: maxHours ? parseInt(maxHours) : undefined,
        amenities,
        capacity: capacity ? parseInt(capacity) : null,
        operatingHours,
        price: hourlyRate ? parseFloat(hourlyRate) : existing.price, // Update backward compat
      },
      include: {
        images: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.json(listing);
  } catch (error) {
    console.error("UPDATE LISTING ERROR:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a listing
 * DELETE /api/host/listings/:id
 */
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;

    // Check ownership
    const existing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    await prisma.listing.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("DELETE LISTING ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update listing status
 * PATCH /api/host/listings/:id/status
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hostId = req.user.userId;

    // Check ownership
    const existing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        images: true
      }
    });

    res.json(listing);
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    res.json({ message: "deleteImage not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setCoverImage = async (req, res) => {
  try {
    res.json({ message: "setCoverImage not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
