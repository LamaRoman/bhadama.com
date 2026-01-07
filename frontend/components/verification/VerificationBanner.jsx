'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Mail, X, CheckCircle } from 'lucide-react';
import { api } from '@/utils/api';

export default function VerificationBanner({ user, onVerified }) {
  const [isVisible, setIsVisible] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false); // ❌ Start hidden
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0); // ❌ Start at 0
  const [message, setMessage] = useState('Please verify your email to access all features.'); // ✅ Initial message
  const [messageType, setMessageType] = useState('info');

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Don't show banner if email is verified
  if (user?.emailVerified || user?.email_verified) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  // Send OTP
  const handleSendCode = async () => {
    if (isSending || countdown > 0) return;

    setIsSending(true);
    setMessage('');
    setMessageType('info');

    try {
      const response = await api('/api/verification/email/send', { method: 'POST' });

      setMessage(response.message || 'Verification code sent to your email!');
      setMessageType('success');
      setCountdown(60);
      setShowOtpInput(true); // show input after sending

    } catch (error) {
      console.error('❌ Failed to send code:', error);
      const errorMessage = error.message || 'Failed to send verification code. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      setMessageType('error');
      return;
    }

    setIsVerifying(true);
    setMessage('');

    try {
      const response = await api('/api/verification/email/verify', {
        method: 'POST',
        body: { otp },
      });

      setMessage(response.message || 'Email verified successfully!');
      setMessageType('success');

      if (onVerified) setTimeout(() => onVerified(), 1500);
      setTimeout(() => setIsVisible(false), 2000);

    } catch (error) {
      console.error('❌ Verification failed:', error);
      let errorMessage = error.message || 'Invalid verification code. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = () => setIsVisible(false);

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

            {/* Show "Verify Now" button if OTP input is hidden */}
            {!showOtpInput ? (
              <div className="mt-4">
                <button
                  onClick={() => setShowOtpInput(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 transition-colors duration-150"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Verify Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
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
                    className="w-full max-w-xs px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                    disabled={isVerifying}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isVerifying || otp.length !== 6}
                    className={`flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md shadow-sm
                      ${isVerifying || otp.length !== 6
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                      } transition-colors duration-150`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isVerifying ? 'Verifying...' : 'Verify Email'}
                  </button>

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
                    {countdown > 0 ? `${countdown}s` : 'Resend'}
                  </button>
                </div>

                <p className="text-xs text-yellow-700">
                  💡 Didn't receive the code? Check your spam folder or click <strong>Resend</strong> after the timer expires.
                </p>
              </form>
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
