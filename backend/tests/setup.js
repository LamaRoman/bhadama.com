// ==========================================
// TEST SETUP FILE
// ==========================================
// File: backend/tests/setup.js
//
// Runs before each test file
// ==========================================

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Use test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

const prisma = new PrismaClient();

// ==========================================
// GLOBAL SETUP - Runs once before all tests
// ==========================================
beforeAll(async () => {
  // Reset database to clean state
  try {
    await prisma.$connect();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error.message);
    throw error;
  }
});

// ==========================================
// CLEANUP - Runs after each test file
// ==========================================
afterEach(async () => {
  // Clean up test data created during tests
  // Order matters due to foreign key constraints
  const deleteOrder = [
    'supportMessage',
    'supportTicket',
    'notificationDelivery',
    'notification',
    'blogCommentLike',
    'blogComment',
    'blogLike',
    'blogView',
    'blogPost',
    'reviewReport',
    'review',
    'refund',
    'booking',
    'savedListing',
    'blockedDate',
    'specialPricing',
    'promotionRequest',
    'listingModeration',
    'image',
    'message',
    'listing',
    'payment',
    'subscriptionHistory',
    'hostSubscription',
    'verificationLog',
    'securityAuditLog',
    'failedLoginAttempt',
    'userSession',
    'apiKey',
    'adminProfile',
    'hostStory',
    'contributorProfile',
    'user',
  ];

  // Only clean if we're in test mode
  if (process.env.NODE_ENV === 'test') {
    for (const model of deleteOrder) {
      try {
        if (prisma[model]) {
          await prisma[model].deleteMany({});
        }
      } catch (error) {
        // Ignore errors for models that don't exist
      }
    }
  }
});

// ==========================================
// GLOBAL TEARDOWN - Runs once after all tests
// ==========================================
afterAll(async () => {
  await prisma.$disconnect();
  console.log('✅ Test database disconnected');
});

// ==========================================
// GLOBAL TEST UTILITIES
// ==========================================
global.prisma = prisma;

// Helper to create test user
global.createTestUser = async (overrides = {}) => {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('Test@123456', 12);
  
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'USER',
      emailVerified: true,
      ...overrides
    }
  });
};

// Helper to create test host
global.createTestHost = async (overrides = {}) => {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('Test@123456', 12);
  
  return prisma.user.create({
    data: {
      name: 'Test Host',
      email: `host-${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'HOST',
      emailVerified: true,
      currentTier: 'FREE',
      ...overrides
    }
  });
};

// Helper to create test admin
global.createTestAdmin = async (overrides = {}) => {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('Test@123456', 12);
  
  return prisma.user.create({
    data: {
      name: 'Test Admin',
      email: `admin-${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      emailVerified: true,
      ...overrides
    }
  });
};

// Helper to create test listing
global.createTestListing = async (hostId, overrides = {}) => {
  return prisma.listing.create({
    data: {
      title: 'Test Listing',
      description: 'A test listing for testing',
      location: 'Kathmandu',
      address: '123 Test Street',
      hostId,
      capacity: 50,
      minCapacity: 10,
      hourlyRate: 5000,
      minHours: 2,
      maxHours: 12,
      includedGuests: 10,
      status: 'ACTIVE',
      slug: `test-listing-${Date.now()}`,
      amenities: ['WiFi', 'Parking', 'AC'],
      rules: ['No smoking', 'No pets'],
      ...overrides
    }
  });
};

// Helper to generate auth token
global.generateTestToken = async (user) => {
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Console output cleanup
console.log('🧪 Test environment initialized');
// Stop cron jobs after all tests
afterAll(async () => {
  try {
    const cron = await import('node-cron');
    const tasks = cron.getTasks();
    tasks.forEach(task => task.stop());
  } catch (e) {
    // Ignore if cron not available
  }
});

// Stop cron jobs after all tests
afterAll(async () => {
  try {
    const cron = await import('node-cron');
    const tasks = cron.getTasks();
    tasks.forEach(task => task.stop());
  } catch (e) {
    // Ignore if cron not available
  }
});

// Stop cron jobs after all tests
afterAll(async () => {
  try {
    const cron = await import('node-cron');
    const tasks = cron.getTasks();
    tasks.forEach(task => task.stop());
  } catch (e) {
    // Ignore if cron not available
  }
});
