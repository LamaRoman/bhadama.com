import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET availability for a listing
router.get("/:listingId", authMiddleware, async (req, res) => {
  const listingId = Number(req.params.listingId);
  if (!listingId) return res.status(400).json({ error: "Invalid listingId" });

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
});

// POST new availability dates
router.post(
  "/:listingId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const listingId = Number(req.params.listingId);
    const { dates } = req.body;

    if (!Array.isArray(dates) || dates.length === 0)
      return res.status(400).json({ error: "Invalid dates" });

    try {
      await prisma.availability.createMany({
        data: dates.map((d) => ({ listingId, date: new Date(d) })),
        skipDuplicates: true,
      });

      const updatedAvailability = await prisma.availability.findMany({
        where: { listingId },
        orderBy: { date: "asc" },
      });

      res.json(updatedAvailability);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST toggle availability based on date
router.post(
  "/toggle",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    try {
      const { listingId, date } = req.body;

      if (!listingId || !date)
        return res.status(400).json({ error: "listingId and date required" });

      const isoDate = new Date(date);

      // CHECK if record exists
      const existing = await prisma.availability.findFirst({
        where: {
          listingId: Number(listingId),
          date: isoDate,
        },
      });

      // IF NO RECORD → create unavailable record
      if (!existing) {
        const newRecord = await prisma.availability.create({
          data: {
            listingId: Number(listingId),
            date: isoDate,
            isAvailable: false, // by default: blocked
          },
        });

        return res.json({
          message: "Date blocked",
          availability: newRecord,
        });
      }

      // IF EXISTS → toggle isAvailable
      const updated = await prisma.availability.update({
        where: { id: existing.id },
        data: { isAvailable: !existing.isAvailable },
      });

      return res.json({
        message: updated.isAvailable ? "Date unblocked" : "Date blocked",
        availability: updated,
      });
    } catch (err) {
      console.error("TOGGLE AVAILABILITY ERROR:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);


export default router;
