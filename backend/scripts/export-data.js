import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📤 Exporting database data...\n');

  const data = {
    users: await prisma.user.findMany(),
    hostTiers: await prisma.hostTier.findMany(),
    tierPricing: await prisma.tierPricing.findMany(),
    hostSubscriptions: await prisma.hostSubscription.findMany(),
    listings: await prisma.listing.findMany(),
    images: await prisma.image.findMany(),
    bookings: await prisma.booking.findMany(),
    reviews: await prisma.review.findMany(),
    blogPosts: await prisma.blogPost.findMany(),
    // Add more tables as needed
  };

  // Write to JSON file
  fs.writeFileSync(
    'prisma/exported-data.json',
    JSON.stringify(data, null, 2)
  );

  console.log('✅ Data exported to prisma/exported-data.json\n');
  console.log('📊 Summary:');
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Host Tiers: ${data.hostTiers.length}`);
  console.log(`- Listings: ${data.listings.length}`);
  console.log(`- Images: ${data.images.length}`);
  console.log(`- Bookings: ${data.bookings.length}`);
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());