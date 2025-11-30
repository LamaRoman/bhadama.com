import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["USER"]), async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { listingId: rawListingId, dates: rawDates } = req.body;
    const userId = req.user.userId;
    console.log("USER ID:", userId);

    // Validate listingId
    const listingId = Number(rawListingId);
    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    // Validate dates
    if (!Array.isArray(rawDates) || rawDates.length === 0) {
      return res.status(400).json({ error: "Dates array is required" });
    }

    const bookings = [];

    // Use Prisma transaction for atomic booking
    await prisma.$transaction(async (prismaTx) => {
      for (const dateStr of rawDates) {
        console.log("Processing date:", dateStr);

        const startOfDay = new Date(dateStr);
        if (isNaN(startOfDay)) {
          throw new Error(`Invalid date: ${dateStr}`);
        }
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if user already has a booking for this listing/date
        const existingBooking = await prismaTx.booking.findFirst({
          where: {
            listingId,
            userId,
            startDate: startOfDay,
          },
        });
        if (existingBooking) {
          throw new Error(`You already have a booking for ${dateStr}`);
        }

        // Check availability
        let availRecord = await prismaTx.availability.findFirst({
          where: { listingId, date: startOfDay },
        });

        if (!availRecord) {
          // Create new availability record as booked
          availRecord = await prismaTx.availability.create({
            data: { listingId, date: startOfDay, isAvailable: false },
          });
          console.log("Created new availability record:", availRecord);
        } else {
          if (!availRecord.isAvailable) {
            throw new Error(`Date not available: ${dateStr}`);
          }
          // Mark as booked
          availRecord = await prismaTx.availability.update({
            where: { id: availRecord.id },
            data: { isAvailable: false },
          });
          console.log("Updated availability record:", availRecord);
        }

        // Create booking
        const booking = await prismaTx.booking.create({
          data: {
            listingId,
            userId,
            startDate: startOfDay,
            endDate: endOfDay,
          },
        });
        console.log("Created booking:", booking);
        bookings.push(booking);
      }
    });

    res.json({ message: "All bookings created successfully", bookings });
  } catch (err) {
    console.error("BOOKING ROUTE ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
