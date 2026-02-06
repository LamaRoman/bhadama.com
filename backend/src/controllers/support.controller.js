// ============================================
// SUPPORT TICKET CONTROLLER
// ============================================
// Handles support ticket creation, viewing, and messaging
// ============================================

import { prisma } from "../config/prisma.config.js";
import emailService from "../services/email/email.service.js";

// ============================================
// GENERATE TICKET NUMBER
// ============================================

async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}`;
  
  // Get the last ticket of this year
  const lastTicket = await prisma.supportTicket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      ticketNumber: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
}

// ============================================
// CREATE TICKET (User)
// ============================================

export const createTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, subject, message, priority, relatedType, relatedId } = req.body;

    // Validate required fields
    if (!category || !subject || !message) {
      return res.status(400).json({ 
        error: "Category, subject, and message are required" 
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Create ticket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        userType: user.role,
        category,
        subject,
        priority: priority || "MEDIUM",
        status: "OPEN",
        relatedType: relatedType || null,
        relatedId: relatedId ? Number(relatedId) : null,
        messages: {
          create: {
            senderId: user.id,
            senderType: "USER",
            message,
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, profilePhoto: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    console.log(`✅ Support ticket created: ${ticketNumber}`);

    // Send confirmation email to user
    try {
      await emailService.sendTicketConfirmation(ticket);
    } catch (emailError) {
      console.error("❌ Failed to send ticket confirmation email:", emailError);
    }

    // TODO: Send notification to admin/support team

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error("❌ Create ticket error:", error);
    res.status(500).json({ error: "Failed to create support ticket" });
  }
};

// ============================================
// GET USER'S TICKETS
// ============================================

export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { userId: Number(userId) };
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              message: true,
              createdAt: true,
              senderType: true,
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get user tickets error:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// ============================================
// GET TICKET DETAIL
// ============================================

export const getTicketById = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.userId;
    const { ticketId } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, profilePhoto: true }
        },
        messages: {
          where: {
            isInternal: false  // Don't show internal notes to users
          },
          include: {
            sender: {
              select: { id: true, name: true, profilePhoto: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if user owns this ticket (unless admin)
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { role: true, adminRole: true }
    });

    const isAdmin = user?.role === 'ADMIN' || user?.adminRole;
    
    if (ticket.userId !== Number(userId) && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to view this ticket" });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error("❌ Get ticket error:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// ============================================
// REPLY TO TICKET (User)
// ============================================

export const replyToTicket = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.userId;
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check ownership
    if (ticket.userId !== Number(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ error: "Cannot reply to a closed ticket" });
    }

    // Create message and update ticket status
    const [newMessage] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: Number(userId),
          senderType: "USER",
          message: message.trim(),
        },
        include: {
          sender: {
            select: { id: true, name: true, profilePhoto: true }
          }
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: "WAITING_ADMIN",
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Reply added to ticket ${ticket.ticketNumber}`);

    // TODO: Notify admin of new reply

    res.json({
      success: true,
      message: "Reply sent successfully",
      reply: newMessage
    });
  } catch (error) {
    console.error("❌ Reply to ticket error:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

// ============================================
// CLOSE TICKET (User)
// ============================================

export const closeTicket = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.userId;
    const { ticketId } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.userId !== Number(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ error: "Ticket is already closed" });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: "CLOSED",
        closedAt: new Date()
      }
    });

    console.log(`✅ Ticket ${ticket.ticketNumber} closed by user`);

    res.json({
      success: true,
      message: "Ticket closed successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("❌ Close ticket error:", error);
    res.status(500).json({ error: "Failed to close ticket" });
  }
};

// ============================================
// ADMIN: GET ALL TICKETS
// ============================================

export const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20, search } = req.query;

    const where = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total, stats] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, profilePhoto: true, role: true }
          },
          assignedTo: {
            select: { id: true, name: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              message: true,
              createdAt: true,
              senderType: true,
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.supportTicket.count({ where }),
      // Get stats
      prisma.supportTicket.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // Transform stats
    const statusStats = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_USER: 0,
      WAITING_ADMIN: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    stats.forEach(s => {
      statusStats[s.status] = s._count.status;
    });

    res.json({
      success: true,
      tickets,
      stats: statusStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get all tickets error:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// ============================================
// ADMIN: GET TICKET DETAIL (includes internal notes)
// ============================================

export const getAdminTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true,
            profilePhoto: true, 
            role: true,
            createdAt: true,
            _count: {
              select: { bookings: true, listings: true }
            }
          }
        },
        assignedTo: {
          select: { id: true, name: true, profilePhoto: true }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, profilePhoto: true, role: true, adminRole: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error("❌ Get admin ticket error:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// ============================================
// ADMIN: REPLY TO TICKET
// ============================================

export const adminReplyToTicket = async (req, res) => {
  try {
    const adminId = req.user.userId || req.user.userId;
    const { ticketId } = req.params;
    const { message, isInternal = false, newStatus } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Determine new status
    let status = newStatus || ticket.status;
    if (!newStatus && !isInternal) {
      status = "WAITING_USER";
    }

    // Set first response time if this is first admin reply
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (!ticket.firstResponseAt && !isInternal) {
      updateData.firstResponseAt = new Date();
    }

    // Create message and update ticket
    const [newMessage] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: Number(adminId),
          senderType: "ADMIN",
          message: message.trim(),
          isInternal
        },
        include: {
          sender: {
            select: { id: true, name: true, profilePhoto: true, adminRole: true }
          }
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: updateData
      })
    ]);

    console.log(`✅ Admin reply added to ticket ${ticket.ticketNumber}${isInternal ? ' (internal)' : ''}`);

    // Send email notification to user (only for non-internal messages)
    if (!isInternal) {
      try {
        await emailService.sendTicketReply(ticket, newMessage);
      } catch (emailError) {
        console.error("❌ Failed to send ticket reply email:", emailError);
      }
    }

    res.json({
      success: true,
      message: isInternal ? "Internal note added" : "Reply sent successfully",
      reply: newMessage
    });
  } catch (error) {
    console.error("❌ Admin reply error:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

// ============================================
// ADMIN: UPDATE TICKET STATUS/PRIORITY
// ============================================

export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, assignedToId } = req.body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(ticketId) }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const updateData = { updatedAt: new Date() };
    
    if (status) {
      updateData.status = status;
      if (status === 'CLOSED' || status === 'RESOLVED') {
        updateData.closedAt = new Date();
      }
    }
    if (priority) {
      updateData.priority = priority;
    }
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId ? Number(assignedToId) : null;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    console.log(`✅ Ticket ${ticket.ticketNumber} updated`);

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("❌ Update ticket error:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
};

// ============================================
// ADMIN: GET SUPPORT STATS
// ============================================

export const getSupportStats = async (req, res) => {
  try {
    const [
      totalTickets,
      openTickets,
      resolvedToday,
      ticketsWithResponseTime
    ] = await Promise.all([
      // Total tickets
      prisma.supportTicket.count(),
      
      // Open tickets (not resolved/closed)
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ADMIN'] } }
      }),
      
      // Resolved today
      prisma.supportTicket.count({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          closedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Get tickets with response times for calculation
      // FIXED: Removed createdAt check since it's always present
      prisma.supportTicket.findMany({
        where: {
          NOT: {
            firstResponseAt: null
          }
        },
        select: {
          createdAt: true,
          firstResponseAt: true
        }
      })
    ]);

    // Calculate average response time in minutes
    let avgResponseTimeMinutes = null;
    if (ticketsWithResponseTime.length > 0) {
      const totalResponseTime = ticketsWithResponseTime.reduce((sum, ticket) => {
        const responseTime = new Date(ticket.firstResponseAt) - new Date(ticket.createdAt);
        return sum + responseTime;
      }, 0);
      
      const avgResponseTimeMs = totalResponseTime / ticketsWithResponseTime.length;
      avgResponseTimeMinutes = Math.round(avgResponseTimeMs / (1000 * 60)); // Convert to minutes
    }

    // Get tickets by category
    const byCategory = await prisma.supportTicket.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    // Get tickets by priority (only open ones)
    const byPriority = await prisma.supportTicket.groupBy({
      by: ['priority'],
      where: { 
        NOT: {
          status: 'CLOSED'
        }
      },
      _count: { priority: true }
    });

    res.json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        resolvedToday,
        avgResponseTimeMinutes,
        byCategory: byCategory.reduce((acc, c) => {
          acc[c.category] = c._count.category;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, p) => {
          acc[p.priority] = p._count.priority;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("❌ Get support stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export default {
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
};