// hooks/usePhoneVerification.js

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';

export function usePhoneVerification(onVerified) {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [isVerified, setIsVerified] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-verify when OTP is 6 digits
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      verifyCode();
    }
  }, [otp]);

  // Send verification code
  const sendCode = useCallback(async (phoneNumber) => {
    if (!phoneNumber) {
      setMessage('No phone number provided');
      setMessageType('error');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const response = await api('/api/verification/phone/send', {
        method: 'POST',
        body: { phoneNumber },
      });

      if (response.error) {
        setMessage(response.error);
        setMessageType('error');
        
        // Handle rate limiting
        if (response.remainingSeconds) {
          setCountdown(response.remainingSeconds);
        }
        if (response.remainingMinutes) {
          setCountdown(response.remainingMinutes * 60);
        }
      } else {
        setShowOtpInput(true);
        setMessage(response.message || 'Verification code sent!');
        setMessageType('success');
        setCountdown(60); // 60 second cooldown
      }
    } catch (error) {
      console.error('Send phone verification error:', error);
      setMessage('Failed to send verification code. Please try again.');
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  }, []);

  // Verify OTP code
  const verifyCode = useCallback(async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    setMessage('');

    try {
      const response = await api('/api/verification/phone/verify', {
        method: 'POST',
        body: { otp },
      });

      if (response.error) {
        setMessage(response.error);
        setMessageType('error');
        setOtp('');
        
        if (response.attemptsRemaining !== undefined) {
          setMessage(`${response.error}. ${response.attemptsRemaining} attempts remaining.`);
        }
        
        if (response.locked) {
          setShowOtpInput(false);
        }
      } else if (response.verified) {
        setIsVerified(true);
        setMessage('Phone verified successfully! 🎉');
        setMessageType('success');
        
        if (onVerified) {
          onVerified();
        }
      }
    } catch (error) {
      console.error('Verify phone error:', error);
      setMessage('Verification failed. Please try again.');
      setMessageType('error');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  }, [otp, onVerified]);

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
    verifyCode,
    isVerified,
  };
}

export default usePhoneVerification;