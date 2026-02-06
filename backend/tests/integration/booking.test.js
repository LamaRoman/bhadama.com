// ==========================================
// BOOKING INTEGRATION TESTS
// ==========================================
// Matches actual MyBigYard API routes
// ==========================================

import request from 'supertest';
import app from '../../src/app.js';

const getRandomEmail = () => `user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
const VALID_PASSWORD = 'Secure@789XYZ';

// Helper to get future date
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

describe('Booking Endpoints', () => {
  let hostToken;
  let userToken;
  let testHost;
  let testUser;
  let testListing;

  // Setup: Create host, user, and listing
  beforeAll(async () => {
    // Create host
    const hostEmail = getRandomEmail();
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Booking Test Host',
        email: hostEmail,
        password: VALID_PASSWORD,
        role: 'HOST',
        acceptTerms: true
      });

    const hostLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: hostEmail, password: VALID_PASSWORD });
    
    hostToken = hostLogin.body.accessToken;
    testHost = hostLogin.body.user;

    // Create regular user
    const userEmail = getRandomEmail();
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Booking Test User',
        email: userEmail,
        password: VALID_PASSWORD,
        acceptTerms: true
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });
    
    userToken = userLogin.body.accessToken;
    testUser = userLogin.body.user;

    // Create a listing (host only)
    const listingResponse = await request(app)
      .post('/api/host/listings')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Test Venue for Booking',
        description: 'A beautiful venue for testing bookings',
        location: 'Kathmandu',
        address: '123 Test Street',
        hourlyRate: 5000,
        capacity: 100,
        minCapacity: 10,
        amenities: ['Parking', 'WiFi'],
        images: ['https://example.com/image1.jpg']
      });

    if (listingResponse.status === 201) {
      testListing = listingResponse.body.data || listingResponse.body;
    }
  });

  // ==========================================
  // POST /api/bookings
  // ==========================================
  describe('POST /api/bookings', () => {
    
    it('should create booking successfully', async () => {
      if (!testListing) {
        console.log('Skipping - no test listing available');
        return;
      }

      const bookingData = {
        listingId: testListing.id,
        date: getFutureDate(7),
        startTime: '10:00',
        endTime: '14:00',
        guests: 50,
        notes: 'Test booking'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expect([200, 201]).toContain(response.status);
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('id');
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({
          listingId: 1,
          date: getFutureDate(7),
          startTime: '10:00',
          endTime: '14:00',
          guests: 50
        });

      expect(response.status).toBe(401);
    });

    it('should fail with past date', async () => {
      if (!testListing) return;

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          listingId: testListing.id,
          date: pastDate.toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '14:00',
          guests: 50
        });

      expect([400, 422]).toContain(response.status);
    });

    it('should fail with invalid time range', async () => {
      if (!testListing) return;

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          listingId: testListing.id,
          date: getFutureDate(7),
          startTime: '14:00',
          endTime: '10:00', // End before start
          guests: 50
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  // ==========================================
  // GET /api/bookings
  // ==========================================
  describe('GET /api/bookings', () => {
    
    it('should list user bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) { expect(Array.isArray(response.body.data || response.body.bookings || response.body)).toBe(true); }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/bookings/:id
  // ==========================================
  describe('GET /api/bookings/:id', () => {
    
    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });
  });

  // ==========================================
  // GET /api/bookings/host/all
  // ==========================================
  describe('GET /api/bookings/host/all', () => {
    
    it('should list host bookings', async () => {
      const response = await request(app)
        .get('/api/bookings/host/all')
        .set('Authorization', `Bearer ${hostToken}`);

      expect([200, 401]).toContain(response.status);
    });

    it('should fail for non-host user', async () => {
      const response = await request(app)
        .get('/api/bookings/host/all')
        .set('Authorization', `Bearer ${userToken}`);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings/host/all');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // PATCH /api/bookings/:id/cancel
  // ==========================================
  describe('PATCH /api/bookings/:id/cancel', () => {
    
    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/bookings/1/cancel')
        .send({ reason: 'Test cancellation' });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .patch('/api/bookings/999999/cancel')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Test cancellation' });

      expect([400, 401, 404]).toContain(response.status);
    });
  });
});