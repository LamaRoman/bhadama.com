import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed with real data...\n');

  // Check if tiers exist
  const tierCount = await prisma.hostTier.count();
  if (tierCount === 0) {
    console.log('⚠️  No tiers found. Run: npm run seed:tiers first');
    process.exit(1);
  }

  const freeTier = await prisma.hostTier.findUnique({ where: { name: 'FREE' } });

  // 1. Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bhadama.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bhadama.com',
      password: hashedPassword,
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      isVerified: true,
      emailVerified: true,
      currentTier: 'FREE',
    },
  });

  const host1 = await prisma.user.upsert({
    where: { email: 'host@bhadama.com' },
    update: {},
    create: {
      name: 'Rajesh Kumar',
      email: 'host@bhadama.com',
      password: hashedPassword,
      role: 'HOST',
      isVerified: true,
      emailVerified: true,
      currentTier: 'FREE',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user@bhadama.com' },
    update: {},
    create: {
      name: 'Sita Sharma',
      email: 'user@bhadama.com',
      password: hashedPassword,
      role: 'USER',
      isVerified: true,
      emailVerified: true,
      currentTier: 'FREE',
    },
  });

  console.log('✅ Users created');

  // 2. Create Host Subscription
  console.log('Creating host subscriptions...');
  await prisma.hostSubscription.upsert({
    where: { hostId: host1.id },
    update: {},
    create: {
      hostId: host1.id,
      tierId: freeTier.id,
      status: 'ACTIVE',
      startDate: new Date(),
      currency: 'NPR',
    },
  });

  console.log('✅ Subscriptions created');

  // 3. Create Listings
  console.log('Creating listings...');

  const listing1 = await prisma.listing.upsert({
    where: { slug: 'modern-event-hall-thamel' },
    update: {},
    create: {
      hostId: host1.id,
      title: 'Modern Event Hall in Thamel',
      slug: 'modern-event-hall-thamel',
      description: 'A spacious and modern event hall perfect for parties, meetings, and celebrations. Located in the heart of Thamel.',
      location: 'Thamel, Kathmandu',
      address: 'Thamel Marg, Kathmandu',
      latitude: 27.7172,
      longitude: 85.3240,
      hourlyRate: 54,
      minHours: 2,
      maxHours: 12,
      includedGuests: 10,
      amenities: ['Swimming Pool', 'Parking Available', 'Restrooms', 'WiFi'],
      capacity: 34,
      minCapacity: 1,
      status: 'ACTIVE',
      autoConfirm: false,
      instantBooking: true,
      discountPercent: 1,
      discountFrom: new Date(),
      discountUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      discountReason: 'New Year Sale',
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      featuredPriority: 1,
      operatingHours: {
        monday: { start: '08:00', end: '20:00', closed: false },
        tuesday: { start: '08:00', end: '20:00', closed: false },
        wednesday: { start: '08:00', end: '20:00', closed: false },
        thursday: { start: '08:00', end: '20:00', closed: false },
        friday: { start: '08:00', end: '20:00', closed: false },
        saturday: { start: '08:00', end: '20:00', closed: false },
        sunday: { start: '08:00', end: '20:00', closed: false },
      },
    },
  });

  const listing2 = await prisma.listing.upsert({
    where: { slug: 'lakeside-conference-room' },
    update: {},
    create: {
      hostId: host1.id,
      title: 'Lakeside Conference Room',
      slug: 'lakeside-conference-room',
      description: 'Professional conference room with modern amenities. Perfect for business meetings and workshops.',
      location: 'Kalanki, Kathmandu',
      hourlyRate: 40,
      minHours: 2,
      maxHours: 12,
      includedGuests: 10,
      amenities: ['Playground', 'Pet Friendly', 'Restrooms', 'Projector'],
      capacity: 445,
      minCapacity: 1,
      status: 'ACTIVE',
      autoConfirm: false,
      instantBooking: true,
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      featuredPriority: 1,
      durationDiscounts: {
        tiers: [
          { minHours: 4, discountPercent: 8 },
          { minHours: 6, discountPercent: 13 },
        ],
      },
      operatingHours: {
        monday: { start: '10:00', end: '20:00', closed: false },
        tuesday: { start: '10:00', end: '20:00', closed: false },
        wednesday: { start: '10:00', end: '20:00', closed: false },
        thursday: { start: '10:00', end: '20:00', closed: false },
        friday: { start: '10:00', end: '20:00', closed: false },
        saturday: { start: '10:00', end: '20:00', closed: false },
        sunday: { start: '10:00', end: '20:00', closed: false },
      },
    },
  });

  const listing3 = await prisma.listing.upsert({
    where: { slug: 'garden-venue-kathmandu' },
    update: {},
    create: {
      hostId: host1.id,
      title: 'Beautiful Garden Venue',
      slug: 'garden-venue-kathmandu',
      description: 'Stunning outdoor garden space perfect for weddings, parties, and special events.',
      location: 'Jahapa, Kathmandu',
      hourlyRate: 68,
      minHours: 2,
      maxHours: 12,
      includedGuests: 10,
      amenities: ['Parking Available', 'Sports Court', 'WiFi', 'Garden'],
      capacity: 24,
      minCapacity: 1,
      status: 'ACTIVE',
      autoConfirm: false,
      instantBooking: true,
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      featuredPriority: 1,
      operatingHours: {
        monday: { start: '08:00', end: '20:00', closed: false },
        tuesday: { start: '08:00', end: '20:00', closed: false },
        wednesday: { start: '08:00', end: '20:00', closed: false },
        thursday: { start: '08:00', end: '20:00', closed: false },
        friday: { start: '08:00', end: '20:00', closed: false },
        saturday: { start: '08:00', end: '20:00', closed: false },
        sunday: { start: '08:00', end: '20:00', closed: false },
      },
    },
  });

  const listing4 = await prisma.listing.upsert({
    where: { slug: 'premium-event-space-boudha' },
    update: {},
    create: {
      hostId: host1.id,
      title: 'Premium Event Space in Boudha',
      slug: 'premium-event-space-boudha',
      description: 'Luxury event space with top-tier amenities. Ideal for corporate events and celebrations.',
      location: 'Boudha, Kathmandu',
      hourlyRate: 50,
      minHours: 2,
      maxHours: 12,
      includedGuests: 10,
      amenities: ['Swimming Pool', 'BBQ Grill', 'Fire Pit', 'Parking Available'],
      capacity: 23,
      minCapacity: 1,
      status: 'ACTIVE',
      autoConfirm: false,
      instantBooking: true,
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      featuredPriority: 1,
      durationDiscounts: {
        tiers: [
          { minHours: 6, discountPercent: 15 },
          { minHours: 8, discountPercent: 20 },
        ],
      },
      bonusHoursOffer: {
        minHours: 6,
        bonusHours: 1,
        label: 'Book 6+ hours, get 1 hour FREE!',
      },
      operatingHours: {
        monday: { start: '08:00', end: '20:00', closed: false },
        tuesday: { start: '08:00', end: '20:00', closed: false },
        wednesday: { start: '08:00', end: '20:00', closed: false },
        thursday: { start: '08:00', end: '20:00', closed: false },
        friday: { start: '08:00', end: '20:00', closed: false },
        saturday: { start: '08:00', end: '20:00', closed: false },
        sunday: { start: '08:00', end: '20:00', closed: false },
      },
    },
  });

  console.log('✅ Listings created');

  // 4. Create Images
  console.log('Creating images...');
  
  const images = [
    { listingId: listing1.id, url: 'https://images.unsplash.com/photo-1519167758481-83f29da8c3d1', s3Key: 'placeholder-1', isCover: true, order: 1 },
    { listingId: listing1.id, url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87', s3Key: 'placeholder-2', isCover: false, order: 2 },
    
    { listingId: listing2.id, url: 'https://images.unsplash.com/photo-1497366216548-37526070297c', s3Key: 'placeholder-3', isCover: true, order: 1 },
    { listingId: listing2.id, url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72', s3Key: 'placeholder-4', isCover: false, order: 2 },
    
    { listingId: listing3.id, url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', s3Key: 'placeholder-5', isCover: true, order: 1 },
    { listingId: listing3.id, url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0', s3Key: 'placeholder-6', isCover: false, order: 2 },
    
    { listingId: listing4.id, url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', s3Key: 'placeholder-7', isCover: true, order: 1 },
    { listingId: listing4.id, url: 'https://images.unsplash.com/photo-1519167758481-83f29da8c3d1', s3Key: 'placeholder-8', isCover: false, order: 2 },
  ];

  for (const img of images) {
    await prisma.image.create({ data: img }).catch(() => {});
  }

  console.log('✅ Images created');

  // 5. Create Sample Bookings
  console.log('Creating sample bookings...');
  
  const futureDate1 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  const futureDate2 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

  await prisma.booking.create({
    data: {
      userId: user1.id,
      listingId: listing1.id,
      bookingDate: futureDate1,
      startTime: '14:00',
      endTime: '18:00',
      duration: 4,
      guests: 1,
      basePrice: 216,
      extraGuestPrice: 0,
      serviceFee: 21.6,
      tax: 19.01,
      discountAmount: 0,
      totalPrice: 256.61,
      status: 'CONFIRMED',
      paymentStatus: 'pending',
    },
  }).catch(() => {});

  await prisma.booking.create({
    data: {
      userId: user1.id,
      listingId: listing2.id,
      bookingDate: futureDate2,
      startTime: '10:00',
      endTime: '14:30',
      duration: 4.5,
      guests: 1,
      basePrice: 180,
      extraGuestPrice: 0,
      serviceFee: 18,
      tax: 15.84,
      discountAmount: 0,
      totalPrice: 213.84,
      status: 'CONFIRMED',
      paymentStatus: 'pending',
    },
  }).catch(() => {});

  console.log('✅ Sample bookings created');

  console.log('\n🎉 Production seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('- 3 Users (1 Admin, 1 Host, 1 Guest)');
  console.log('- 4 Listings with various features');
  console.log('- 8 Images');
  console.log('- 2 Sample future bookings');
  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@bhadama.com / password123');
  console.log('Host: host@bhadama.com / password123');
  console.log('User: user@bhadama.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });