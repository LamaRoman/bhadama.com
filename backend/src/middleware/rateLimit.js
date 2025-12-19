// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 booking attempts per windowMs
  message: {
    error: "Too many booking attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per hour
  message: {
    error: "Too many requests from this IP. Please try again later."
  }
});