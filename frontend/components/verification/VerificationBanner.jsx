'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Mail, X, CheckCircle } from 'lucide-react';
import { api } from '@/utils/api';

export default function VerificationBanner({ user, onVerified }) {
  // ----------------------
  // HOOKS
  // ----------------------
  const [isVisible, setIsVisible] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('Please verify your email to access all features.');
  const [messageType, setMessageType] = useState('info');

  // Local flag to prevent repeated verification attempts
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(false);

  // ----------------------
  // Countdown timer
  // ----------------------
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-verify when OTP reaches 6 digits
  useEffect(() => {
    if (otp.length === 6 && showOtpInput && !isVerifying && !isVerifiedLocally) {
      const timer = setTimeout(() => handleVerifyOtp(otp), 300);
      return () => clearTimeout(timer);
    }
  }, [otp, showOtpInput, isVerifying, isVerifiedLocally]);

  // ----------------------
  // EARLY RETURNS
  // ----------------------
  if (!user || user?.emailVerified || user?.email_verified || !isVisible || isVerifiedLocally) {
    return null;
  }

  // ----------------------
  // FUNCTIONS
  // ----------------------
  const handleSendCode = async () => {
    if (isSending || countdown > 0) return;

    setIsSending(true);
    setMessage('Sending verification code...');
    setMessageType('info');

    try {
      const response = await api('/api/verification/email/send', { method: 'POST' });
      setMessage(response.message || 'Verification code sent!');
      setMessageType('success');
      setShowOtpInput(true);
      setCountdown(60);
    } catch (error) {
      console.error('❌ Failed to send code:', error);
      setMessage(error?.message || 'Failed to send verification code.');
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyNowClick = async () => {
    await handleSendCode();
  };

  const handleVerifyOtp = async (otpValue) => {
    if (!otpValue || otpValue.length !== 6) return;

    // Prevent duplicate verification attempts
    if (isVerifying || isVerifiedLocally) return;

    setIsVerifying(true);
    setMessage('Verifying...');
    setMessageType('info');

    try {
      const response = await api('/api/verification/email/verify', {
        method: 'POST',
        body: { otp: otpValue },
      });

      // Treat "already verified" as success
      if (response.verified || response.success) {
        setMessage('✅ Email verified successfully!');
        setMessageType('success');
        setIsVerifiedLocally(true); // Mark locally verified
        setShowOtpInput(false);

        if (onVerified) setTimeout(() => onVerified(), 1000);
        setTimeout(() => setIsVisible(false), 3500);
      } else {
        // Should not happen, but fallback
        setMessage(response.message || 'Verification failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);

      // Treat "already verified" errors as success
      if (error?.error === 'Email already verified' || error?.verified) {
        setMessage('✅ Email already verified!');
        setMessageType('success');
        setIsVerifiedLocally(true);
        setShowOtpInput(false);

        if (onVerified) setTimeout(() => onVerified(), 1000);
        setTimeout(() => setIsVisible(false), 1500);
      } else {
        setMessage(error?.message || 'Invalid code. Try again.');
        setMessageType('error');
        setOtp('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = () => setIsVisible(false);

  // ----------------------
  // JSX
  // ----------------------
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Verify Your Email Address</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Please verify <strong>{user?.email}</strong> to access all features and secure your account.
            </p>

            {message && (
              <div className={`mt-3 p-3 rounded-md text-sm flex items-start gap-2 ${
                messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {messageType === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {messageType === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            {!showOtpInput ? (
              <div className="mt-4">
                <button
                  onClick={handleVerifyNowClick}
                  disabled={isSending}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors duration-150
                    ${isSending ? 'bg-yellow-400 text-white cursor-wait' : 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700'}
                  `}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Verify Now'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-yellow-800 mb-2">
                    Enter the 6-digit code sent to your email
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full max-w-xs px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center text-2xl tracking-[0.5em] font-mono"
                    disabled={isVerifying}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSending || countdown > 0}
                    className={`px-4 py-2.5 text-sm font-medium rounded-md
                      ${countdown > 0 || isSending
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 active:bg-yellow-300'
                      } transition-colors duration-150`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : isSending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>

                <p className="text-xs text-yellow-700">
                  💡 Code will verify automatically when you enter all 6 digits.
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-4 text-yellow-400 hover:text-yellow-600 transition-colors flex-shrink-0"
          aria-label="Dismiss banner"
          title="Dismiss (will show again on next login)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
