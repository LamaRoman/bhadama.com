import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* -------------------- EXISTING LISTING ROUTES -------------------- */

// CREATE LISTING (HOST ONLY)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    try {
      const { title, description, price, location } = req.body;
      if (!title || !description || !price || !location) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const listing = await prisma.listing.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          location,
          hostId: req.user.userId,
        },
      });

      res.json({ message: "Listing created", listing });
    } catch (error) {
      res.status(500).json({ message: "Error creating listing" });
    }
  }
);

// VIEW ALL LISTINGS OF LOGGED-IN HOST
router.get("/", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { hostId: req.user.userId },
  });
  res.json(listings);
});

// VIEW SINGLE LISTING
router.get("/:id", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing || listing.hostId !== req.user.userId) {
    return res.status(403).json({ message: "Not allowed" });
  }

  res.json(listing);
});

// UPDATE LISTING
router.put("/:id", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing || listing.hostId !== req.user.userId) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: req.body,
  });

  res.json(updated);
});

// DELETE LISTING
router.delete("/:id", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing || listing.hostId !== req.user.userId) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await prisma.listing.delete({ where: { id } });
  res.json({ message: "Listing deleted" });
});

/* -------------------- BLOCK / UNBLOCK / AVAILABILITY ROUTES -------------------- */

// routes/hostListings.js
// routes/hostListings.js
router.post("/block-dates", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  try {
    const { listingId: rawListingId, dates: rawDates } = req.body;
    const hostId = req.user.userId;

    const listingId = Number(rawListingId);
    if (isNaN(listingId)) return res.status(400).json({ error: "Invalid listingId" });
    if (!Array.isArray(rawDates) || rawDates.length === 0)
      return res.status(400).json({ error: "Dates array is required" });

    // Convert dates from YYYY-MM-DD strings to UTC midnight Date objects
    const dates = rawDates.map((d) => {
      const [year, month, day] = d.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date;
    });

    await prisma.$transaction(async (prismaTx) => {
      const listing = await prismaTx.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw new Error("Listing not found");
      if (listing.hostId !== hostId) throw new Error("You do not own this listing");

      const availRecords = await prismaTx.availability.findMany({
        where: { listingId, date: { in: dates } },
      });

      const blockPromises = dates.map((date) => {
        const record = availRecords.find((r) => r.date.getTime() === date.getTime());
        if (record) {
          return prismaTx.availability.update({
            where: { id: record.id },
            data: { isAvailable: false },
          });
        } else {
          return prismaTx.availability.create({
            data: { listingId, date, isAvailable: false },
          });
        }
      });

      const blockedDates = await Promise.all(blockPromises);
      res.json({ message: "Dates successfully blocked", blockedDates: blockedDates.map(d => d.date.toISOString().split("T")[0]) });
    });
  } catch (err) {
    console.error("HOST BLOCK ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});



// Only HOST can unblock dates
router.post("/unblock-dates", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  try {
    const { listingId: rawListingId, dates: rawDates } = req.body;
    const hostId = req.user.userId;

    if (!rawListingId || !Array.isArray(rawDates) || rawDates.length === 0) {
      return res.status(400).json({ error: "Listing ID and dates are required" });
    }

    const listingId = Number(rawListingId);
    if (isNaN(listingId)) return res.status(400).json({ error: "Invalid listing ID" });

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== hostId) return res.status(403).json({ error: "Not your listing" });

    // Convert YYYY-MM-DD → UTC Date
    const dates = rawDates.map(d => {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    });

    // Find existing blocked rows
    const blockedRecords = await prisma.availability.findMany({
      where: {
        listingId,
        isAvailable: false,
        date: { in: dates }
      }
    });

    if (blockedRecords.length === 0) {
      return res.json({ message: "No blocked dates found to unblock", deleted: [] });
    }

    // DELETE blocked records
    await prisma.availability.deleteMany({
      where: {
        id: { in: blockedRecords.map(r => r.id) }
      }
    });

    res.json({
      message: "Dates unblocked successfully",
      deleted: blockedRecords.map(r => r.date.toISOString().split("T")[0])
    });

  } catch (err) {
    console.error("Unblock dates error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET availability for frontend calendar (blocked + booked)
router.get("/availability/:listingId", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.hostId !== req.user.userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const availRecords = await prisma.availability.findMany({ where: { listingId } });
    const bookings = await prisma.booking.findMany({ where: { listingId } });

    const blockedDates = availRecords.filter(r => !r.isAvailable).map(r => r.date.toISOString().split("T")[0]);
    const bookedDates = bookings.map(b => b.startDate.toISOString().split("T")[0]);

    res.json({ blockedDates, bookedDates });
  } catch (err) {
    console.error("HOST AVAILABILITY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle block/unblock dates
router.post("/toggle-block-dates", authMiddleware, roleMiddleware(["HOST"]), async (req, res) => {
  try {
    const { listingId: rawListingId, dates: rawDates } = req.body;
    const hostId = req.user.userId;

    if (!rawListingId || !Array.isArray(rawDates) || rawDates.length === 0) {
      return res.status(400).json({ error: "Listing ID and dates are required" });
    }

    const listingId = Number(rawListingId);
    if (isNaN(listingId)) return res.status(400).json({ error: "Invalid listing ID" });

    // Check ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== hostId) return res.status(403).json({ error: "Not your listing" });

    // Normalize dates to local midnight
    const dates = rawDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const updated = [];

    // Use transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        const record = await tx.availability.findFirst({ where: { listingId, date } });
        if (record) {
          // Toggle isAvailable
          const updatedRecord = await tx.availability.update({
            where: { id: record.id },
            data: { isAvailable: !record.isAvailable },
          });
          updated.push(updatedRecord);
        } else {
          // Create new blocked date
          const newRecord = await tx.availability.create({
            data: { listingId, date, isAvailable: false },
          });
          updated.push(newRecord);
        }
      }
    });

    const blockedDates = updated
      .filter((d) => !d.isAvailable)
      .map((d) => d.date.toISOString().split("T")[0]);

    res.json({ message: "Dates toggled successfully", updated, blockedDates });
  } catch (err) {
    console.error("Toggle block/unblock dates error:", err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
