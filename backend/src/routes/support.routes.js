// ============================================
// SUPPORT TICKET ROUTES
// ============================================

import express from "express";
import {
  createTicket,
  getUserTickets,
  getTicketById,
  replyToTicket,
  closeTicket,
  getAllTickets,
  getAdminTicketById,
  adminReplyToTicket,
  updateTicket,
  getSupportStats
} from "../controllers/support.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { isModeratorOrAbove } from "../middleware/adminAuth.js";

const router = express.Router();

// ============================================
// USER ROUTES (authenticated users)
// ============================================

// Create a new support ticket
router.post("/tickets", authenticate, createTicket);

// Get user's tickets
router.get("/tickets", authenticate, getUserTickets);

// Get single ticket detail
router.get("/tickets/:ticketId", authenticate, getTicketById);

// Reply to a ticket
router.post("/tickets/:ticketId/reply", authenticate, replyToTicket);

// Close a ticket
router.patch("/tickets/:ticketId/close", authenticate, closeTicket);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all tickets (admin)
router.get("/admin/tickets", authenticate, isModeratorOrAbove, getAllTickets);

// Get support stats (admin)
router.get("/admin/stats", authenticate, isModeratorOrAbove, getSupportStats);

// Get single ticket with internal notes (admin)
router.get("/admin/tickets/:ticketId", authenticate, isModeratorOrAbove, getAdminTicketById);

// Admin reply to ticket
router.post("/admin/tickets/:ticketId/reply", authenticate, isModeratorOrAbove, adminReplyToTicket);

// Update ticket status/priority/assignment (admin)
router.patch("/admin/tickets/:ticketId", authenticate, isModeratorOrAbove, updateTicket);

export default router;