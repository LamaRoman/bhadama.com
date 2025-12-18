/**
 * Create a new listing
 * POST /api/host/listings
 */
export const createListing = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      status,
      hourlyRate,
      halfDayRate,
      fullDayRate,
      minHours,
      maxHours,
      amenities,
      capacity,
      operatingHours
    } = req.body;
    
    const hostId = req.user.userId; // ← Fixed: was req.user.id

    // Validate at least one rate is provided
    if (!hourlyRate && !halfDayRate && !fullDayRate) {
      return res.status(400).json({ 
        error: "At least one pricing option (hourly, half-day, or full-day) is required" 
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        status: status || "ACTIVE",
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        halfDayRate: halfDayRate ? parseFloat(halfDayRate) : null,
        fullDayRate: fullDayRate ? parseFloat(fullDayRate) : null,
        minHours: minHours ? parseInt(minHours) : 2,
        maxHours: maxHours ? parseInt(maxHours) : 12,
        amenities: amenities || [],
        capacity: capacity ? parseInt(capacity) : null,
        operatingHours: operatingHours || null,
        price: hourlyRate ? parseFloat(hourlyRate) : 0, // Backward compatibility
        host: {
          connect: { id: hostId },
        },
      },
      include: {
        images: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error("CREATE LISTING ERROR:", error);
    res.status(400).json({ error: error.message });
  }
};