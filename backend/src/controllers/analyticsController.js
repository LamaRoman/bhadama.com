// controllers/analyticsController.js
export async function getListingAnalytics(req, res) {
  try {
    const listingId = parseInt(req.params.listingId);
    const hostId = req.user.userId;

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, hostId }
    });

    if (!listing) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get booking analytics
    const bookings = await prisma.booking.groupBy({
      by: ['status'],
      where: { listingId },
      _count: true
    });

    // Revenue analytics
    const revenue = await prisma.booking.aggregate({
      where: { 
        listingId,
        status: "COMPLETED",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _sum: { totalPrice: true }
    });

    // Popular times
    const popularTimes = await prisma.booking.groupBy({
      by: ['startTime'],
      where: { listingId },
      _count: true,
      orderBy: { _count: 'desc' },
      take: 5
    });

    res.json({
      bookings,
      revenue: revenue._sum.totalPrice || 0,
      popularTimes,
      occupancyRate: await calculateOccupancyRate(listingId)
    });
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}