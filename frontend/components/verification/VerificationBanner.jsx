'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, Mail, X, CheckCircle, Shield } from 'lucide-react';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export default function VerificationBanner({ user, onVerified }) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if verification is required (mandatory for hosts)
  const isRequired = user?.role === 'HOST';
  
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
  } = useEmailVerification(onVerified);

  // Auto-dismiss banner when verification succeeds
  useEffect(() => {
    if (isVerified) {
      setIsDismissed(true);
    }
  }, [isVerified]);

  // Don't show if dismissed (users only, hosts cannot dismiss)
  if (isDismissed) return null;

  return (
    <div className={`${isRequired ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-yellow-50 border-l-4 border-yellow-400'} p-4 mb-6 rounded-r-lg shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          {isRequired ? (
            <Shield className="h-5 w-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${isRequired ? 'text-orange-800' : 'text-yellow-800'}`}>
              {isRequired ? 'Email Verification Required' : 'Verify Your Email Address'}
            </h3>

            <p className={`mt-1 text-sm ${isRequired ? 'text-orange-700' : 'text-yellow-700'}`}>
              {isRequired 
                ? <>Please verify <strong>{user.email}</strong> to publish listings.</>
                : <>Please verify <strong>{user.email}</strong> to access all features.</>
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
              <button
                onClick={sendCode}
                disabled={isSending}
                className={`mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isRequired
                    ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500'
                    : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
                }`}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Verify Now'}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="otp-input" className="sr-only">
                    Enter 6-digit verification code
                  </label>
                  <input
                    id="otp-input"
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
                        : 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
                    }`}
                    disabled={isVerifying}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                <button
                  onClick={sendCode}
                  disabled={countdown > 0 || isSending}
                  className={`px-4 py-2 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isRequired
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 focus:ring-orange-500'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-500'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Only show dismiss button for users, not for hosts */}
        {!isRequired && (
          <button
            onClick={() => setIsDismissed(true)}
            className="text-yellow-400 hover:text-yellow-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            aria-label="Dismiss verification banner"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}