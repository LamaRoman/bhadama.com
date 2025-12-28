// controllers/hostDiscountController.js
import {prisma} from "../config/prisma.js";

export const setDurationDiscounts = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { durationDiscounts, bonusHoursOffer } = req.body;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(listingId), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    // Validate duration discounts structure
    if (durationDiscounts) {
      if (!durationDiscounts.tiers || !Array.isArray(durationDiscounts.tiers)) {
        return res.status(400).json({ 
          error: "durationDiscounts must have a 'tiers' array" 
        });
      }

      // Validate each tier
      for (const tier of durationDiscounts.tiers) {
        if (!tier.minHours || tier.minHours < 1) {
          return res.status(400).json({ 
            error: "Each tier must have minHours >= 1" 
          });
        }
        if (!tier.discountPercent || tier.discountPercent < 1 || tier.discountPercent > 50) {
          return res.status(400).json({ 
            error: "Discount percent must be between 1-50%" 
          });
        }
      }

      // Check for duplicate minHours
      const hours = durationDiscounts.tiers.map(t => t.minHours);
      if (new Set(hours).size !== hours.length) {
        return res.status(400).json({ 
          error: "Duplicate minHours values not allowed" 
        });
      }

      // Sort tiers by minHours ascending
      durationDiscounts.tiers.sort((a, b) => a.minHours - b.minHours);
    }

    // Validate bonus hours offer
    if (bonusHoursOffer) {
      if (!bonusHoursOffer.minHours || bonusHoursOffer.minHours < 1) {
        return res.status(400).json({ 
          error: "Bonus offer minHours must be >= 1" 
        });
      }
      if (!bonusHoursOffer.bonusHours || bonusHoursOffer.bonusHours < 1) {
        return res.status(400).json({ 
          error: "Bonus hours must be >= 1" 
        });
      }
    }

    // Update listing with discounts
    const updated = await prisma.listing.update({
      where: { id: parseInt(listingId) },
      data: {
        durationDiscounts: durationDiscounts || null,
        bonusHoursOffer: bonusHoursOffer || null,
      },
      select: {
        id: true,
        title: true,
        hourlyRate: true,
        durationDiscounts: true,
        bonusHoursOffer: true,
      },
    });

    res.json({ 
      message: "Duration discounts updated successfully", 
      listing: updated 
    });
  } catch (error) {
    console.error("Update duration discounts error:", error);
    res.status(500).json({ error: "Failed to update duration discounts" });
  }
};

export const getDurationDiscounts = async (req, res) => {
  try {
    const { listingId } = req.params;
    const hostId = req.user.id;

    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(listingId), hostId },
      select: {
        id: true,
        title: true,
        hourlyRate: true,
        durationDiscounts: true,
        bonusHoursOffer: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    res.json({ 
      durationDiscounts: listing.durationDiscounts || { tiers: [] },
      bonusHoursOffer: listing.bonusHoursOffer || null,
      hourlyRate: listing.hourlyRate,
    });
  } catch (error) {
    console.error("Get duration discounts error:", error);
    res.status(500).json({ error: "Failed to get duration discounts" });
  }
};


export const addSpecialPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, hourlyRate, reason } = req.body;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    const specialPricing = await prisma.specialPricing.create({
      data: {
        listingId: parseInt(id),
        date: new Date(date),
        hourlyRate: parseFloat(hourlyRate),
        reason: reason || null,
      },
    });

    res.json({
      message: "Special pricing added",
      specialPricing,
    });
  } catch (error) {
    console.error("Add special pricing error:", error);
    if (error.code === "P2021") {
      return res.status(501).json({ 
        error: "Special pricing feature requires database migration. Run: npx prisma migrate dev" 
      });
    }
    res.status(500).json({ error: "Failed to add special pricing" });
  }
};

// Get special pricing
export const getSpecialPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    const specialPricing = await prisma.specialPricing.findMany({
      where: { 
        listingId: parseInt(id),
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
    });

    res.json({ specialPricing });
  } catch (error) {
    console.error("Get special pricing error:", error);
    res.status(500).json({ error: "Failed to get special pricing", specialPricing: [] });
  }
};

// Remove special pricing
export const removeSpecialPricing = async (req, res) => {
  try {
    const { id, pricingId } = req.params;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    await prisma.specialPricing.delete({
      where: { id: parseInt(pricingId) },
    });

    res.json({ message: "Special pricing removed" });
  } catch (error) {
    console.error("Remove special pricing error:", error);
    res.status(500).json({ error: "Failed to remove special pricing" });
  }
};

// ============ BLOCKED DATES ============

// Block dates
export const blockDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        listingId: parseInt(id),
        date: new Date(startDate), // Using 'date' field from schema
        reason: reason || "Blocked by host",
      },
    });

    res.json({
      message: "Dates blocked successfully",
      blockedDate,
    });
  } catch (error) {
    console.error("Block dates error:", error);
    if (error.code === "P2021") {
      return res.status(501).json({ 
        error: "Blocked dates feature requires database migration" 
      });
    }
    res.status(500).json({ error: "Failed to block dates" });
  }
};

// Get blocked dates
export const getBlockedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    const blockedDates = await prisma.blockedDate.findMany({
      where: { 
        listingId: parseInt(id),
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
    });

    res.json({ blockedDates });
  } catch (error) {
    console.error("Get blocked dates error:", error);
    res.status(500).json({ error: "Failed to get blocked dates", blockedDates: [] });
  }
};

// Unblock dates
export const unblockDates = async (req, res) => {
  try {
    const { id, blockId } = req.params;
    const hostId = req.user.id;

    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    await prisma.blockedDate.delete({
      where: { id: parseInt(blockId) },
    });

    res.json({ message: "Dates unblocked successfully" });
  } catch (error) {
    console.error("Unblock dates error:", error);
    res.status(500).json({ error: "Failed to unblock dates" });
  }
};

// ============ BOOKING SETTINGS ============

// Update booking settings
export const updateBookingSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      autoConfirm,
      instantBooking,
      minAdvanceBooking,
      maxAdvanceBooking,
      minHours,
      maxHours,
    } = req.body;
    const hostId = req.user.id;

    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    // Validate min/max hours
    if (minHours && maxHours && minHours > maxHours) {
      return res.status(400).json({ error: "Minimum hours cannot be greater than maximum hours" });
    }

    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: {
        ...(autoConfirm !== undefined && { autoConfirm: Boolean(autoConfirm) }),
        ...(instantBooking !== undefined && { instantBooking: Boolean(instantBooking) }),
        ...(minAdvanceBooking !== undefined && { minAdvanceBooking: parseInt(minAdvanceBooking) }),
        ...(maxAdvanceBooking !== undefined && { maxAdvanceBooking: parseInt(maxAdvanceBooking) }),
        ...(minHours !== undefined && { minHours: parseInt(minHours) }),
        ...(maxHours !== undefined && { maxHours: parseInt(maxHours) }),
      },
    });

    res.json({
      message: "Booking settings updated",
      settings: {
        autoConfirm: updated.autoConfirm,
        instantBooking: updated.instantBooking,
        minAdvanceBooking: updated.minAdvanceBooking,
        maxAdvanceBooking: updated.maxAdvanceBooking,
        minHours: updated.minHours,
        maxHours: updated.maxHours,
      },
    });
  } catch (error) {
    console.error("Update booking settings error:", error);
    res.status(500).json({ error: "Failed to update booking settings" });
  }
};

// Get booking settings
export const getBookingSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
      select: {
        id: true,
        title: true,
        autoConfirm: true,
        instantBooking: true,
        minAdvanceBooking: true,
        maxAdvanceBooking: true,
        minHours: true,
        maxHours: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    res.json({ settings: listing });
  } catch (error) {
    console.error("Get booking settings error:", error);
    res.status(500).json({ error: "Failed to get booking settings" });
  }
};

// ============ PROMOTION REQUESTS ============

// Get promotion request
export const getPromotionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or unauthorized" });
    }

    // Get latest request
    const request = await prisma.promotionRequest.findFirst({
      where: { listingId: parseInt(id) },
      orderBy: { createdAt: "desc" },
    });

    res.json({ request });
  } catch (error) {
    console.error("Get promotion request error:", error);
    res.status(500).json({ error: "Failed to get promotion request", request: null });
  }
};

export async function setListingDiscount(req, res) {
  try {
    const { listingId } = req.params;
    const hostId = req.user.id;
    const { discountPercent, discountFrom, discountUntil, discountReason } = req.body;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(listingId), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // ✅ VALIDATION: All fields are required
    if (!discountPercent || discountPercent < 1 || discountPercent > 90) {
      return res.status(400).json({ error: "Discount percentage must be between 1% and 90%" });
    }

    if (!discountFrom) {
      return res.status(400).json({ error: "Start date is required" });
    }

    if (!discountUntil) {
      return res.status(400).json({ error: "End date is required" });
    }

    if (!discountReason || discountReason.trim().length < 3) {
      return res.status(400).json({ error: "Discount label is required (minimum 3 characters)" });
    }

    // Validate dates
    const fromDate = new Date(discountFrom);
    const untilDate = new Date(discountUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      return res.status(400).json({ error: "Start date cannot be in the past" });
    }

    if (untilDate <= fromDate) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    // Max 90 days
    const diffDays = Math.ceil((untilDate - fromDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      return res.status(400).json({ error: "Discount period cannot exceed 90 days" });
    }

    // Update listing
    const updated = await prisma.listing.update({
      where: { id: parseInt(listingId) },
      data: {
        discountPercent: parseInt(discountPercent),
        discountFrom: fromDate,
        discountUntil: untilDate,
        discountReason: discountReason.trim(),
      },
    });

    res.json({
      message: "Discount saved successfully",
      discount: {
        percent: updated.discountPercent,
        from: updated.discountFrom,
        until: updated.discountUntil,
        reason: updated.discountReason,
      },
    });
  } catch (error) {
    console.error("Set discount error:", error);
    res.status(500).json({ error: "Failed to set discount" });
  }
}

/**
 * Remove discount from a listing
 */
export async function removeListingDiscount(req, res) {
  console.log(req.params)
  try {
    
    const { listingId } = req.params;
    const hostId = req.user.userId; // ← use userId, matches DB

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(listingId), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or you are not authorized" });
    }

    await prisma.listing.update({
      where: { id: parseInt(listingId) },
      data: {
        discountPercent: 0,
        discountFrom: null,
        discountUntil: null,
        discountReason: null,
      },
    });

    res.json({ message: "Discount removed successfully" });
  } catch (error) {
    console.error("Remove discount error:", error);
    res.status(500).json({ error: "Failed to remove discount" });
  }
}




/**
 * Remove all duration discounts and bonus offers
 */
export async function removeDurationDiscounts(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    await prisma.listing.update({
      where: { id: parseInt(id) },
      data: {
        durationDiscounts: null,
        bonusHoursOffer: null,
      },
    });

    res.json({ message: "Duration discounts removed successfully" });
  } catch (error) {
    console.error("Remove duration discounts error:", error);
    res.status(500).json({ error: "Failed to remove duration discounts" });
  }
}

/**
 * Submit a promotion request (Featured listing)
 * REQUIRES: startDate, endDate
 */
export async function submitPromotionRequest(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.id;
    const { duration, startDate, endDate, message } = req.body;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: parseInt(id), hostId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // ✅ VALIDATION: Dates are required
    if (!startDate) {
      return res.status(400).json({ error: "Start date is required" });
    }

    if (!endDate) {
      return res.status(400).json({ error: "End date is required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ error: "Start date cannot be in the past" });
    }

    if (end <= start) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 3) {
      return res.status(400).json({ error: "Minimum promotion period is 3 days" });
    }

    if (diffDays > 30) {
      return res.status(400).json({ error: "Maximum promotion period is 30 days" });
    }

    // Check for existing pending request
    const existingRequest = await prisma.promotionRequest.findFirst({
      where: {
        listingId: parseInt(id),
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending promotion request" });
    }

    // Create request
    const request = await prisma.promotionRequest.create({
      data: {
        listingId: parseInt(id),
        hostId,
        duration: diffDays,
        startDate: start,
        endDate: end,
        message: message || null,
        status: "PENDING",
      },
    });

    res.json({
      message: "Promotion request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Submit promotion request error:", error);
    res.status(500).json({ error: "Failed to submit promotion request" });
  }
}

/**
 * Cancel a pending promotion request
 */
export async function cancelPromotionRequest(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    // Find the request
    const request = await prisma.promotionRequest.findFirst({
      where: {
        listingId: parseInt(id),
        hostId,
        status: "PENDING",
      },
    });

    if (!request) {
      return res.status(404).json({ error: "No pending promotion request found" });
    }

    await prisma.promotionRequest.delete({
      where: { id: request.id },
    });

    res.json({ message: "Promotion request cancelled" });
  } catch (error) {
    console.error("Cancel promotion request error:", error);
    res.status(500).json({ error: "Failed to cancel promotion request" });
  }
}

