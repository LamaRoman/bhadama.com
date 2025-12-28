import { prisma } from "../config/prisma.js";
import { uploadToS3 } from "../config/s3.js";

export const uploadImages = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const hostId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload each file to S3
      const { secure_url, key } = await uploadToS3(file, null, listingId);

      // Determine if this should be the cover image
      const isCover = i === 0; // first uploaded image is cover

      // Save in database
      const image = await prisma.image.create({
        data: {
          listingId,
          url: secure_url,
          s3Key: key,      // store the S3 key for deletion later
          isCover,
        },
      });

      uploadedImages.push(image);
    }

    res.status(201).json({
      message: "Images uploaded successfully",
      images: uploadedImages,
    });
  } catch (error) {
    console.error("UPLOAD IMAGES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};



// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now();
};

export const createListing = async (req, res) => {
  try {
    console.log("📝 Creating listing with data:", req.body);
    console.log("👤 Host ID:", req.user.userId);
    
    const { 
      title, 
      description, 
      location, 
      status,
      hourlyRate,
      minHours,
      maxHours,
      amenities,
      capacity,
      operatingHours,
      address,
      includedGuests,
      extraGuestCharge,
      minCapacity,
      size,
      rules,
      featured
    } = req.body;
    
    const hostId = req.user.userId;

    // Validate required fields from schema
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    if (!hourlyRate) {
      return res.status(400).json({ error: "Hourly rate is required" });
    }
    if (!capacity) {
      return res.status(400).json({ error: "Capacity is required" });
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Prepare data exactly as schema requires
    const listingData = {
      // Required fields (from schema)
      title,
      slug,
      location,
      hourlyRate: parseFloat(hourlyRate),
      capacity: parseInt(capacity),
      
      // Optional fields with defaults
      description: description || "",
      address: address || null,
      includedGuests: includedGuests ? parseInt(includedGuests) : 10,
      extraGuestCharge: extraGuestCharge ? parseFloat(extraGuestCharge) : null,
      minCapacity: minCapacity ? parseInt(minCapacity) : 1,
      size: size || null,
      minHours: minHours ? parseInt(minHours) : 1,
      maxHours: maxHours ? parseInt(maxHours) : 12,
      status: status || "ACTIVE",
      featured: featured || false,
      views: 0,
      
      // Arrays with defaults
      amenities: amenities || [],
      rules: rules || [],
      
      // JSON field
      operatingHours: operatingHours || {
        monday: { start: "08:00", end: "20:00", closed: false },
        tuesday: { start: "08:00", end: "20:00", closed: false },
        wednesday: { start: "08:00", end: "20:00", closed: false },
        thursday: { start: "08:00", end: "20:00", closed: false },
        friday: { start: "08:00", end: "20:00", closed: false },
        saturday: { start: "08:00", end: "20:00", closed: false },
        sunday: { start: "08:00", end: "20:00", closed: false }
      },
      
      // Connect host (required relation)
      host: {
        connect: { id: hostId }
      }
    };

    console.log("📦 Prepared listing data:", listingData);

    const listing = await prisma.listing.create({
      data: listingData,
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

    console.log("✅ Listing created successfully:", listing.id);

    res.status(201).json(listing);
  } catch (error) {
    console.error("❌ CREATE LISTING ERROR:", error);
    console.error("❌ Error details:", error.message);
    
    // Handle specific errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'slug') {
        return res.status(400).json({ 
          error: "A listing with this title already exists. Please try a different title." 
        });
      }
    }
    
    res.status(400).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
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

/**
 * Update listing duration discounts and bonus hours
 * PUT /api/host/listings/:id/discounts
 */
export const updateDiscounts = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;
    const { durationDiscounts, bonusHoursOffer } = req.body;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Validate tiers
    if (durationDiscounts?.tiers) {
      for (const tier of durationDiscounts.tiers) {
        if (!tier.minHours || tier.minHours < 1) {
          return res.status(400).json({ error: "Each tier must have minHours >= 1" });
        }
        if (!tier.discountPercent || tier.discountPercent < 1 || tier.discountPercent > 50) {
          return res.status(400).json({ error: "Discount must be 1-50%" });
        }
      }
      
      // Check for duplicates
      const hours = durationDiscounts.tiers.map(t => t.minHours);
      if (new Set(hours).size !== hours.length) {
        return res.status(400).json({ error: "Duplicate minHours not allowed" });
      }
    }

    // Validate bonus
    if (bonusHoursOffer) {
      if (!bonusHoursOffer.minHours || bonusHoursOffer.minHours < 1) {
        return res.status(400).json({ error: "Bonus minHours must be >= 1" });
      }
      if (!bonusHoursOffer.bonusHours || bonusHoursOffer.bonusHours < 1) {
        return res.status(400).json({ error: "Bonus hours must be >= 1" });
      }
    }

    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: {
        durationDiscounts: durationDiscounts || null,
        bonusHoursOffer: bonusHoursOffer || null,
      },
      select: {
        id: true,
        durationDiscounts: true,
        bonusHoursOffer: true,
      },
    });

    res.json({ message: "Discounts updated", listing: updated });
  } catch (error) {
    console.error("Update discounts error:", error);
    res.status(500).json({ error: "Failed to update discounts" });
  }
};
