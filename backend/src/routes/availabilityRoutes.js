import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get availability for a listing
router.get(
  "/:listingId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const listingId = Number(req.params.listingId);

    try {
      const availability = await prisma.availability.findMany({
        where: { listingId },
        orderBy: { date: "asc" },
      });
      res.json(availability);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Add new availability dates
router.post(
  "/:listingId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const listingId = Number(req.params.listingId);
    const { dates } = req.body; // array of dates e.g. ["2025-12-01","2025-12-02"]

    if (!dates || !Array.isArray(dates))
      return res.status(400).json({ error: "Invalid dates" });

    try {
      const created = await prisma.availability.createMany({
        data: dates.map((d) => ({
          listingId,
          date: new Date(d),
        })),
        skipDuplicates: true,
      });

      res.json({ message: "Availability added", created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Toggle availability (true/false)
router.put(
  "/:availabilityId/toggle",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const availabilityId = Number(req.params.availabilityId);
    try {
      const avail = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });
      if (!avail)
        return res.status(404).json({ error: "Availability not found" });

      const updated = await prisma.availability.update({
        where: { id: availabilityId },
        data: { isAvailable: !avail.isAvailable },
      });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
