import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as emailVerificationController from '../controllers/email.verification.controller.js';
import * as phoneVerificationController from '../controllers/phone.verification.controller.js';

const router = express.Router();

/* ==================== EMAIL VERIFICATION ==================== */

/**
 * @route   POST /api/verification/email/send
 * @desc    Send email verification OTP
 * @access  Private (Authenticated users)
 */
router.post('/email/send', authenticate, emailVerificationController.sendEmailVerification);

/**
 * @route   POST /api/verification/email/verify
 * @desc    Verify email with OTP
 * @access  Private (Authenticated users)
 */
router.post('/email/verify', authenticate, emailVerificationController.verifyEmail);

/**
 * @route   GET /api/verification/email/status
 * @desc    Get email verification status
 * @access  Private (Authenticated users)
 */
router.get('/email/status', authenticate, emailVerificationController.getEmailVerificationStatus);

/* ==================== PHONE VERIFICATION ==================== */

/**
 * @route   POST /api/verification/phone/send
 * @desc    Send phone verification OTP (SMS)
 * @access  Private (Authenticated users)
 */
router.post('/phone/send', authenticate, phoneVerificationController.sendPhoneVerification);

/**
 * @route   POST /api/verification/phone/verify
 * @desc    Verify phone with OTP
 * @access  Private (Authenticated users)
 */
router.post('/phone/verify', authenticate, phoneVerificationController.verifyPhone);

/**
 * @route   GET /api/verification/phone/status
 * @desc    Get phone verification status
 * @access  Private (Authenticated users)
 */
router.get('/phone/status', authenticate, phoneVerificationController.getPhoneVerificationStatus);

export default router;