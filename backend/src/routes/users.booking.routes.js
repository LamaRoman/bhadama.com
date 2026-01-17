import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET all bookings for the logged-in user
router.get("/bookings", authMiddleware, roleMiddleware(["USER"]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { listing: true }, // include listing details
      orderBy: { startDate: "asc" },
    });
    res.json({ bookings });
  } catch (err) {
    console.error("GET USER BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// POST /api/bookings/:id - update booking dates
router.post("/:id", authMiddleware, roleMiddleware(["USER"]), async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;
    const { dates } = req.body; // array of new dates

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Dates array is required" });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Delete old availability records for this booking
    for (let d = new Date(booking.startDate); d <= booking.endDate; d.setDate(d.getDate() + 1)) {
      await prisma.availability.updateMany({
        where: { listingId: booking.listingId, date: d },
        data: { isAvailable: true },
      });
    }

    // Create new booking dates
    const newStart = new Date(dates[0]);
    const newEnd = new Date(dates[dates.length - 1]);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        startDate: newStart,
        endDate: newEnd,
      },
    });

    // Mark new dates as unavailable
    for (const dateStr of dates) {
      const d = new Date(dateStr);
      await prisma.availability.upsert({
        where: { listingId_date: { listingId: booking.listingId, date: d } },
        update: { isAvailable: false },
        create: { listingId: booking.listingId, date: d, isAvailable: false },
      });
    }

    res.json({ message: "Booking updated successfully" });
  } catch (err) {
    console.error("UPDATE BOOKING ERROR:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// DELETE /api/bookings/:id - delete a booking
router.delete("/bookings/:id", authMiddleware, roleMiddleware(["USER"]), async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Free the booked dates
    for (let d = new Date(booking.startDate); d <= booking.endDate; d.setDate(d.getDate() + 1)) {
      await prisma.availability.updateMany({
        where: { listingId: booking.listingId, date: d },
        data: { isAvailable: true },
      });
    }

    // Delete booking
    await prisma.booking.delete({ where: { id: bookingId } });

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
