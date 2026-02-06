// ==========================================
// AUTH INTEGRATION TESTS - FIXED
// ==========================================
// File: backend/tests/integration/auth.test.js
// ==========================================

import request from 'supertest';
import app from '../../src/app.js';

// Helper to generate unique email
const getRandomEmail = () => `user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

// Password that won't conflict with any name
// Must have: lowercase, uppercase, number, special char, 8+ chars
// Must NOT contain: name parts like "test", "user", "john", etc.
const VALID_PASSWORD = 'Secure@789XYZ';

describe('Auth Endpoints', () => {
  
  // ==========================================
  // POST /api/auth/register
  // ==========================================
  describe('POST /api/auth/register', () => {
    
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',  // Name doesn't appear in password
        email: getRandomEmail(),
        password: VALID_PASSWORD,
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should register a new host successfully', async () => {
      const hostData = {
        name: 'Jane Smith',
        email: getRandomEmail(),
        password: VALID_PASSWORD,
        role: 'HOST',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(hostData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('HOST');
    });

    it('should fail without acceptTerms', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Terms User',
          email: getRandomEmail(),
          password: VALID_PASSWORD
          // Missing acceptTerms
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Email User',
          password: VALID_PASSWORD,
          acceptTerms: true
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email User',
          email: 'not-an-email',
          password: VALID_PASSWORD,
          acceptTerms: true
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass User',
          email: getRandomEmail(),
          password: '123',  // Too short
          acceptTerms: true
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  // ==========================================
  // POST /api/auth/login
  // ==========================================
  describe('POST /api/auth/login', () => {
    let testUserEmail;
    
    // Create a user before login tests
    beforeAll(async () => {
      testUserEmail = getRandomEmail();
      const regResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Tester',
          email: testUserEmail,
          password: VALID_PASSWORD,
          acceptTerms: true
        });
      
      // Debug: log if registration failed
      if (regResponse.status !== 201) {
        console.log('Registration failed:', regResponse.body);
      }
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: VALID_PASSWORD
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.message).toBe('Login successful');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword@123'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: VALID_PASSWORD
        });

      expect(response.status).toBe(401);
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  // ==========================================
  // GET /api/auth/me
  // ==========================================
  describe('GET /api/auth/me', () => {
    let accessToken;
    let testUserEmail;

    beforeAll(async () => {
      // Register and login to get token
      testUserEmail = getRandomEmail();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me Endpoint Tester',
          email: testUserEmail,
          password: VALID_PASSWORD,
          acceptTerms: true
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: VALID_PASSWORD
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return current user data', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUserEmail);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/auth/logout
  // ==========================================
  describe('POST /api/auth/logout', () => {
    let accessToken;

    beforeAll(async () => {
      const email = getRandomEmail();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Logout Tester',
          email,
          password: VALID_PASSWORD,
          acceptTerms: true
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: VALID_PASSWORD });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/auth/refresh
  // ==========================================
  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const email = getRandomEmail();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Refresh Tester',
          email,
          password: VALID_PASSWORD,
          acceptTerms: true
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: VALID_PASSWORD });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should issue new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      // Your API returns 401 for missing refresh token
      expect([400, 401]).toContain(response.status);
    });
  });

  // ==========================================
  // POST /api/auth/forgot-password
  // ==========================================
  describe('POST /api/auth/forgot-password', () => {
    let testUserEmail;

    beforeAll(async () => {
      testUserEmail = getRandomEmail();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Forgot Password Tester',
          email: testUserEmail,
          password: VALID_PASSWORD,
          acceptTerms: true
        });
    });

    it('should send reset email for valid user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUserEmail });

      expect(response.status).toBe(200);
    });

    it('should return 200 even for non-existent email', async () => {
      // Security: Don't reveal if email exists
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect([400, 401]).toContain(response.status);
    });
  });
});