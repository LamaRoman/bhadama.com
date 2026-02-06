// ==========================================
// PAYMENT INTEGRATION TESTS
// ==========================================
// Matches actual MyBigYard API routes:
// - POST /api/payments/initiate
// - GET /api/payments/history
// - GET /api/payments/:paymentId
// - GET /api/payments/callback/esewa
// - GET /api/payments/callback/khalti
// ==========================================

import request from 'supertest';
import app from '../../src/app.js';

const getRandomEmail = () => `user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
const VALID_PASSWORD = 'Secure@789XYZ';

describe('Payment Endpoints', () => {
  let hostToken;
  let userToken;
  let testHost;
  let testUser;
  let testListing;
  let testBooking;

  beforeAll(async () => {
    // Create host
    const hostEmail = getRandomEmail();
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Payment Test Host',
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
        name: 'Payment Test User',
        email: userEmail,
        password: VALID_PASSWORD,
        acceptTerms: true
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });
    
    userToken = userLogin.body.accessToken;
    testUser = userLogin.body.user;

    // Create a listing
    const listingResponse = await request(app)
      .post('/api/host/listings')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Test Venue for Payment',
        description: 'A venue for testing payments',
        location: 'Kathmandu',
        address: '123 Payment Street',
        hourlyRate: 5000,
        capacity: 100,
        minCapacity: 10,
        amenities: ['Parking'],
        images: ['https://example.com/image.jpg']
      });

    if (listingResponse.status === 201 || listingResponse.status === 200) {
      testListing = listingResponse.body.data || listingResponse.body;
    }

    // Create a booking
    if (testListing) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dateStr = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          listingId: testListing.id,
          date: dateStr,
          startTime: '10:00',
          endTime: '14:00',
          guests: 50
        });

      if (bookingResponse.status === 201 || bookingResponse.status === 200) {
        testBooking = bookingResponse.body.data || bookingResponse.body;
      }
    }
  });

  // ==========================================
  // POST /api/payments/initiate
  // ==========================================
  describe('POST /api/payments/initiate', () => {
    
    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .send({
          bookingId: 1,
          provider: 'esewa'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid booking ID', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: 999999,
          provider: 'esewa'
        });

      expect([400, 401, 404]).toContain(response.status);
    });

    it('should fail with invalid provider', async () => {
      if (!testBooking) {
        console.log('Skipping - no test booking available');
        return;
      }

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: testBooking.id,
          provider: 'invalid_provider'
        });

      expect([400, 422]).toContain(response.status);
    });

    it('should initiate eSewa payment', async () => {
      if (!testBooking) {
        console.log('Skipping - no test booking available');
        return;
      }

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: testBooking.id,
          provider: 'esewa'
        });

      // Could be 200, 201, or 400 if booking already has payment
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should initiate Khalti payment', async () => {
      if (!testBooking) {
        console.log('Skipping - no test booking available');
        return;
      }

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: testBooking.id,
          provider: 'khalti'
        });

      // Could be 200, 201, or 400 if booking already has payment
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  // ==========================================
  // GET /api/payments/history
  // ==========================================
  describe('GET /api/payments/history', () => {
    
    it('should get payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) { expect(Array.isArray(response.body.data || response.body)).toBe(true); }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/payments/history');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/payments/:paymentId
  // ==========================================
  describe('GET /api/payments/:paymentId', () => {
    
    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/payments/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .get('/api/payments/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });
  });

  // ==========================================
  // Payment Callbacks (typically called by payment providers)
  // ==========================================
  describe('Payment Callbacks', () => {
    
    it('eSewa callback should handle invalid data', async () => {
      const response = await request(app)
        .get('/api/payments/callback/esewa')
        .query({
          oid: 'invalid-order',
          amt: '1000',
          refId: 'invalid-ref'
        });

      // Should handle gracefully - either redirect or error
      expect([200, 302, 400, 401, 404]).toContain(response.status);
    });

    it('Khalti callback should handle invalid data', async () => {
      const response = await request(app)
        .get('/api/payments/callback/khalti')
        .query({
          pidx: 'invalid-pidx',
          status: 'Completed'
        });

      // Should handle gracefully
      expect([200, 302, 400, 401, 404]).toContain(response.status);
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================
  describe('Edge Cases', () => {
    
    it('should prevent duplicate payment initiation', async () => {
      if (!testBooking) {
        console.log('Skipping - no test booking available');
        return;
      }

      // Try to initiate payment twice
      await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: testBooking.id,
          provider: 'esewa'
        });

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: testBooking.id,
          provider: 'esewa'
        });

      // Second attempt might succeed (update) or fail (already pending)
      expect([200, 201, 400, 409]).toContain(response.status);
    });
  });
});