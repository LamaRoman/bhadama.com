// ==========================================
// BOOKING CLEANUP CRON JOB
// ==========================================
// File: jobs/booking-cleanup.js
//
// Automatically cleans up expired pending bookings
// Runs every 5 minutes
// ==========================================

import cron from 'node-cron';
import { cleanupExpiredBookings, completeExpiredBookings } from '../controllers/booking.controller.js';

/**
 * Schedule: Every 5 minutes
 * Cleans up pending bookings older than 30 minutes
 */
export const startBookingCleanupJob = () => {
  if (process.env.NODE_ENV === "test") return;
  // Cleanup expired pending bookings (payment abandoned)
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🧹 Running expired booking cleanup...');
      const count = await cleanupExpiredBookings();
      if (count > 0) {
        console.log(`✅ Cleaned up ${count} expired bookings`);
      }
    } catch (error) {
      console.error('❌ Booking cleanup job failed:', error);
    }
  });

  console.log('✅ Booking cleanup job started (runs every 5 minutes)');
};

/**
 * Schedule: Every hour
 * Marks confirmed bookings as completed if time has passed
 */
export const startBookingCompletionJob = () => {
  if (process.env.NODE_ENV === "test") return;
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('✅ Running booking completion check...');
      await completeExpiredBookings();
    } catch (error) {
      console.error('❌ Booking completion job failed:', error);
    }
  });

  console.log('✅ Booking completion job started (runs every hour)');
};

/**
 * Start all booking-related cron jobs
 */
export const startBookingJobs = () => {
  startBookingCleanupJob();
  startBookingCompletionJob();
};

export default startBookingJobs;