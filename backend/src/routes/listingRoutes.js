import express from "express";
import {prisma} from "../config/prisma.js"
import {authMiddleware} from "../middleware/authMiddleware.js";
import {roleMiddleware} from "../middleware/roleMiddleware.js";

const router = express.Router();

// CREATE LISTING (HOST ONLY)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    try {
      const { title, description, price, location } = req.body;

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
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const listings = await prisma.listing.findMany({
      where: { hostId: req.user.userId },
    });

    res.json(listings);
  }
);

// VIEW SINGLE LISTING
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const id = Number(req.params.id);

    const listing = await prisma.listing.findUnique({ where: { id } });
    console.log(listing)

    if (!listing || listing.hostId !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(listing);
  }
);

// UPDATE LISTING
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
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
  }
);

// DELETE LISTING
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["HOST"]),
  async (req, res) => {
    const id = Number(req.params.id);

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing || listing.hostId !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.listing.delete({ where: { id } });

    res.json({ message: "Listing deleted" });
  }
);

export default router;
