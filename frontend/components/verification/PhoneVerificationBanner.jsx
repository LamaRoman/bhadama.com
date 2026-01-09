'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, Phone, X, CheckCircle, Shield } from 'lucide-react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { api } from '@/utils/api';

export default function PhoneVerificationBanner({ user, onVerified, isRequired = false }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [showPhoneInput, setShowPhoneInput] = useState(!user?.phone);
  const [savingPhone, setSavingPhone] = useState(false);
  const [currentPhone, setCurrentPhone] = useState(user?.phone || '');
  
  const {
    showOtpInput,
    otp,
    setOtp,
    isSending,
    isVerifying,
    countdown,
    message,
    messageType,
    sendCode,
    isVerified,
  } = usePhoneVerification(onVerified);

  // Auto-dismiss banner when verification succeeds
  useEffect(() => {
    if (isVerified) {
      setIsDismissed(true);
    }
  }, [isVerified]);

  // Update phone input when user prop changes
  useEffect(() => {
    if (user?.phone) {
      setPhoneInput(user.phone);
      setCurrentPhone(user.phone);
      setShowPhoneInput(false);
    }
  }, [user?.phone]);

  // Don't show if dismissed
  if (isDismissed) return null;

  // Handle saving phone number first, then send OTP
  const handleVerifyNow = async () => {
    // If no phone or phone input shown, save phone first
    if (!currentPhone || showPhoneInput) {
      if (!phoneInput.trim()) {
        return;
      }
      
      setSavingPhone(true);
      try {
        const response = await api('/api/users', {
          method: 'PUT',
          body: { 
            name: user.name,
            email: user.email,
            phone: phoneInput.trim() 
          },
        });
        
        if (response.error) {
          // Use the hook's message display
          return;
        }
        
        // Phone saved, now send OTP
        setCurrentPhone(phoneInput.trim());
        setShowPhoneInput(false);
        await sendCode(phoneInput.trim());
      } catch (error) {
        console.error('Failed to save phone:', error);
      } finally {
        setSavingPhone(false);
      }
    } else {
      // Phone already exists, just send OTP
      await sendCode(currentPhone);
    }
  };

  return (
    <div className={`${isRequired ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-blue-50 border-l-4 border-blue-400'} p-4 mb-6 rounded-r-lg shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          {isRequired ? (
            <Shield className="h-5 w-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
          ) : (
            <Phone className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${isRequired ? 'text-orange-800' : 'text-blue-800'}`}>
              {isRequired ? 'Phone Verification Required' : 'Verify Your Phone Number'}
            </h3>

            <p className={`mt-1 text-sm ${isRequired ? 'text-orange-700' : 'text-blue-700'}`}>
              {currentPhone && !showPhoneInput
                ? (isRequired 
                    ? <>Please verify <strong>{currentPhone}</strong> to publish listings.</>
                    : <>Verify <strong>{currentPhone}</strong> for faster booking confirmations.</>)
                : (isRequired
                    ? 'Please add and verify your phone number to publish listings.'
                    : 'Add and verify your phone number for faster booking confirmations.')
              }
            </p>

            {message && (
              <div
                className={`mt-3 p-3 rounded-md text-sm flex gap-2 ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : messageType === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {messageType === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {messageType === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            {!showOtpInput ? (
              <div className="mt-4 space-y-3">
                {/* Phone input - show if no phone or user wants to change */}
                {showPhoneInput && (
                  <div>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+977 98XXXXXXXX"
                      className={`w-full max-w-xs px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                        isRequired
                          ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'
                          : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter with country code (e.g., +977 for Nepal)
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyNow}
                    disabled={isSending || savingPhone || (showPhoneInput && !phoneInput.trim())}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isRequired
                        ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500'
                        : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                    }`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {savingPhone ? 'Saving...' : isSending ? 'Sending...' : 'Verify Now'}
                  </button>
                  
                  {/* Change number link - only show if phone exists */}
                  {currentPhone && !showPhoneInput && (
                    <button
                      onClick={() => setShowPhoneInput(true)}
                      className={`text-sm underline ${
                        isRequired ? 'text-orange-600 hover:text-orange-800' : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      Change number
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="phone-otp-input" className="sr-only">
                    Enter 6-digit verification code
                  </label>
                  <input
                    id="phone-otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className={`w-full max-w-xs px-4 py-3 border-2 rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 ${
                      isRequired
                        ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'
                        : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    disabled={isVerifying}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                <button
                  onClick={() => sendCode(currentPhone)}
                  disabled={countdown > 0 || isSending}
                  className={`px-4 py-2 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isRequired
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 focus:ring-orange-500'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss button - always show for users, never for required (hosts) */}
        {!isRequired && (
          <button
            onClick={() => setIsDismissed(true)}
            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Dismiss phone verification banner"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}