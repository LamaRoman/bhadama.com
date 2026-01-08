import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/utils/api';

export function useEmailVerification(onVerified) {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isVerified, setIsVerified] = useState(false);
  const hasVerified = useRef(false); // ✅ Prevent duplicate verification calls

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send verification code
  const sendCode = useCallback(async () => {
    if (isSending || countdown > 0) return;

    setIsSending(true);
    setMessage('Sending verification code...');
    setMessageType('info');

    try {
      const response = await api('/api/verification/email/send', {
        method: 'POST',
      });

      setMessage(response.message || 'Verification code sent to your email!');
      setMessageType('success');
      setCountdown(60);
      setShowOtpInput(true);
    } catch (error) {
      setMessage(error?.message || 'Failed to send verification code.');
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  }, [isSending, countdown]);

  // Verify OTP
  const verifyOtp = useCallback(async (otpValue) => {
    // ✅ Prevent duplicate calls
    if (isVerifying || otpValue.length !== 6 || hasVerified.current) return;

    hasVerified.current = true; // ✅ Mark as processing
    setIsVerifying(true);
    setMessage('Verifying...');
    setMessageType('info');

    try {
      const response = await api('/api/verification/email/verify', {
        method: 'POST',
        body: { otp: otpValue },
      });

      setMessage(response.message || 'Email verified successfully!');
      setMessageType('success');
      setIsVerified(true);

      // Call onVerified after a delay
      if (onVerified) {
        setTimeout(onVerified, 1500);
      }
    } catch (error) {
      // ✅ Only show error if it's NOT "already verified"
      const errorMsg = error?.message || 'Invalid verification code.';
      
      // If already verified, treat as success
      if (errorMsg.toLowerCase().includes('already verified')) {
        setMessage('Email verified successfully!');
        setMessageType('success');
        setIsVerified(true);
        
        if (onVerified) {
          setTimeout(onVerified, 500);
        }
      } else {
        setMessage(errorMsg);
        setMessageType('error');
        setOtp('');
        hasVerified.current = false; // ✅ Allow retry on real errors
      }
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, onVerified]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !isVerifying && !hasVerified.current) {
      const timer = setTimeout(() => verifyOtp(otp), 300);
      return () => clearTimeout(timer);
    }
  }, [otp, isVerifying, verifyOtp]);

  return {
    showOtpInput,
    otp,
    setOtp,
    isSending,
    isVerifying,
    countdown,
    message,
    messageType,
    sendCode,
    verifyOtp,
    isVerified,
  };
}