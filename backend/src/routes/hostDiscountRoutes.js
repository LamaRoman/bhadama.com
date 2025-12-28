// routes/hostDiscountRoutes.js
import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import * as controller from "../controllers/hostDiscountController.js";

const router = express.Router();

// All routes require HOST authentication
router.use(authenticate);
router.use(authorize(["HOST"]));

// Discount management
router.post("/:listingId/discount", controller.addDiscount);
router.put("/:listingId/discount", controller.setListingDiscount);
// hostListingRoutes.js
router.delete("/:listingId/discount", (req, res, next) => {
  console.log("DELETE discount route hit!", req.params.listingId);
  next(); // call your controller after logging
}, controller.removeListingDiscount);

//router.delete("/:listingId/discount", controller.removeListingDiscount);

// Special pricing (for specific dates)
router.post("/:listingId/special-pricing", controller.addSpecialPricing);
router.get("/:listingId/special-pricing", controller.getSpecialPricing);
router.delete("/:listingId/special-pricing/:pricingId", controller.removeSpecialPricing);

// Availability blocking
router.post("/:listingId/block-dates", controller.blockDates);
router.get("/:listingId/blocked-dates", controller.getBlockedDates);
router.delete("/:listingId/block-dates/:blockId", controller.unblockDates);

// Booking settings
router.put("/:listingId/booking-settings", controller.updateBookingSettings);
router.get("/:listingId/booking-settings", controller.getBookingSettings);

// Promotion requests
router.post("/:listingId/promotion-request", controller.submitPromotionRequest);
router.get("/:listingId/promotion-request", controller.getPromotionRequest);
router.delete("/:listingId/promotion-request", controller.cancelPromotionRequest);



router.put("/:listingId/duration-discounts", controller.updateDurationDiscounts);
router.delete("/:listingId/duration-discounts", controller.removeDurationDiscounts);
router.get("/:listingId/duration-discounts", controller.getDurationDiscounts);
/** * GET /api/discover/special-offers
 * Fetches all active listings with duration discounts or bonus hour offers
 */
router.get("/special-offers", async (req, res) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch listings that have either durationDiscounts or bonusHoursOffer
    const listings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          {
            durationDiscounts: {
              not: null, // Using Prisma's JSON filter
            },
          },
          {
            bonusHoursOffer: {
              not: null,
            },
          },
        ],
      },
      include: {
        images: {
          take: 1,
          orderBy: { order: "asc" },
        },
        host: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: parseInt(limit),
    });

    // Filter in-memory to ensure they actually have valid offers
    // (JSON columns might have empty objects or arrays)
    const validListings = listings.filter((listing) => {
      const hasDurationDiscounts =
        listing.durationDiscounts?.tiers?.length > 0 ||
        (Array.isArray(listing.durationDiscounts) && listing.durationDiscounts.length > 0);
      const hasBonusOffer =
        listing.bonusHoursOffer && listing.bonusHoursOffer.minHours;
      return hasDurationDiscounts || hasBonusOffer;
    });

    // Format listings for frontend
    const formattedListings = validListings.map((listing) => {
      const hourlyRate = parseFloat(listing.hourlyRate) || 0;
      const discountPercent = listing.discountPercent || 0;
      const discountedPrice =
        discountPercent > 0
          ? Math.round(hourlyRate * (1 - discountPercent / 100))
          : hourlyRate;

      return {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        originalPrice: hourlyRate,
        discountedPrice: discountedPrice,
        discountPercent: discountPercent,
        hasDiscount: discountPercent > 0,
        isFeatured: listing.isFeatured || false,
        coverImage: listing.images?.[0]?.url || null,
        host: listing.host,
        reviewCount: listing._count?.reviews || 0,
        capacity: listing.capacity,
        amenities: listing.amenities || [],
        durationDiscounts: listing.durationDiscounts,
        bonusHoursOffer: listing.bonusHoursOffer,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.listing.count({
      where: {
        status: "ACTIVE",
        OR: [
          { durationDiscounts: { not: null } },
          { bonusHoursOffer: { not: null } },
        ],
      },
    });

    res.json({
      listings: formattedListings,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get special offers error:", error);
    res.status(500).json({ error: "Failed to fetch special offers" });
  }
});

/**
 * GET /api/discover/homepage
 * Updated to include specialOffers section
 */
router.get("/homepage", async (req, res) => {
  try {
    // Common include for all queries
    const include = {
      images: {
        take: 1,
        orderBy: { order: "asc" },
      },
      host: {
        select: { id: true, name: true, profilePhoto: true },
      },
      _count: {
        select: { reviews: true, bookings: true },
      },
    };

    // Fetch different sections in parallel
    const [featured, discounted, trending, newListings, allActive] = await Promise.all([
      // Featured listings
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          isFeatured: true,
          featuredUntil: { gte: new Date() },
        },
        include,
        orderBy: { featuredPriority: "desc" },
        take: 6,
      }),

      // Discounted listings (flat percentage discounts)
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          discountPercent: { gt: 0 },
          OR: [
            { discountUntil: null },
            { discountUntil: { gte: new Date() } },
          ],
        },
        include,
        orderBy: { discountPercent: "desc" },
        take: 6,
      }),

      // Trending (most bookings)
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include,
        orderBy: { bookingCount: "desc" },
        take: 6,
      }),

      // New listings (last 30 days)
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      // All active for special offers filtering
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include,
        take: 100, // Limit for performance
      }),
    ]);

    // Filter special offers from all active listings
    const specialOffers = allActive.filter((listing) => {
      const hasDurationDiscounts =
        listing.durationDiscounts?.tiers?.length > 0 ||
        (Array.isArray(listing.durationDiscounts) && listing.durationDiscounts.length > 0);
      const hasBonusOffer =
        listing.bonusHoursOffer && listing.bonusHoursOffer.minHours;
      return hasDurationDiscounts || hasBonusOffer;
    }).slice(0, 6);

    // Format helper
    const formatListing = (listing) => {
      const hourlyRate = parseFloat(listing.hourlyRate) || 0;
      const discountPercent = listing.discountPercent || 0;
      const discountedPrice =
        discountPercent > 0
          ? Math.round(hourlyRate * (1 - discountPercent / 100))
          : hourlyRate;

      return {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        originalPrice: hourlyRate,
        discountedPrice,
        discountPercent,
        hasDiscount: discountPercent > 0,
        isFeatured: listing.isFeatured || false,
        isNew: listing.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        coverImage: listing.images?.[0]?.url || null,
        host: listing.host,
        reviewCount: listing._count?.reviews || 0,
        capacity: listing.capacity,
        amenities: listing.amenities || [],
        durationDiscounts: listing.durationDiscounts,
        bonusHoursOffer: listing.bonusHoursOffer,
      };
    };

    res.json({
      featured: featured.map(formatListing),
      discounted: discounted.map(formatListing),
      trending: trending.map(formatListing),
      new: newListings.map(formatListing),
      specialOffers: specialOffers.map(formatListing),
    });
  } catch (error) {
    console.error("Homepage data error:", error);
    res.status(500).json({ error: "Failed to fetch homepage data" });
  }
});

export default router;
