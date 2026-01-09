'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, Phone, X, CheckCircle, Shield, ChevronDown } from 'lucide-react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { api } from '@/utils/api';

// Country phone data for the dropdown
const COUNTRY_PHONE_DATA = {
  NP: { code: "+977", name: "Nepal", flag: "🇳🇵", placeholder: "98XXXXXXXX", maxLength: 10 },
  IN: { code: "+91", name: "India", flag: "🇮🇳", placeholder: "9876543210", maxLength: 10 },
  US: { code: "+1", name: "United States", flag: "🇺🇸", placeholder: "2025551234", maxLength: 10 },
  GB: { code: "+44", name: "United Kingdom", flag: "🇬🇧", placeholder: "7911123456", maxLength: 11 },
  AU: { code: "+61", name: "Australia", flag: "🇦🇺", placeholder: "412345678", maxLength: 9 },
  CA: { code: "+1", name: "Canada", flag: "🇨🇦", placeholder: "4165551234", maxLength: 10 },
  DE: { code: "+49", name: "Germany", flag: "🇩🇪", placeholder: "15112345678", maxLength: 11 },
  FR: { code: "+33", name: "France", flag: "🇫🇷", placeholder: "612345678", maxLength: 9 },
  JP: { code: "+81", name: "Japan", flag: "🇯🇵", placeholder: "9012345678", maxLength: 10 },
  CN: { code: "+86", name: "China", flag: "🇨🇳", placeholder: "13812345678", maxLength: 11 },
  AE: { code: "+971", name: "UAE", flag: "🇦🇪", placeholder: "501234567", maxLength: 9 },
  SG: { code: "+65", name: "Singapore", flag: "🇸🇬", placeholder: "81234567", maxLength: 8 },
  MY: { code: "+60", name: "Malaysia", flag: "🇲🇾", placeholder: "123456789", maxLength: 10 },
  TH: { code: "+66", name: "Thailand", flag: "🇹🇭", placeholder: "812345678", maxLength: 9 },
  BD: { code: "+880", name: "Bangladesh", flag: "🇧🇩", placeholder: "1712345678", maxLength: 10 },
  PK: { code: "+92", name: "Pakistan", flag: "🇵🇰", placeholder: "3001234567", maxLength: 10 },
  LK: { code: "+94", name: "Sri Lanka", flag: "🇱🇰", placeholder: "712345678", maxLength: 9 },
  KR: { code: "+82", name: "South Korea", flag: "🇰🇷", placeholder: "1012345678", maxLength: 10 },
  ID: { code: "+62", name: "Indonesia", flag: "🇮🇩", placeholder: "81234567890", maxLength: 12 },
  VN: { code: "+84", name: "Vietnam", flag: "🇻🇳", placeholder: "912345678", maxLength: 10 },
  PH: { code: "+63", name: "Philippines", flag: "🇵🇭", placeholder: "9171234567", maxLength: 10 },
  NL: { code: "+31", name: "Netherlands", flag: "🇳🇱", placeholder: "612345678", maxLength: 9 },
  IT: { code: "+39", name: "Italy", flag: "🇮🇹", placeholder: "3123456789", maxLength: 10 },
  ES: { code: "+34", name: "Spain", flag: "🇪🇸", placeholder: "612345678", maxLength: 9 },
  BR: { code: "+55", name: "Brazil", flag: "🇧🇷", placeholder: "11987654321", maxLength: 11 },
  MX: { code: "+52", name: "Mexico", flag: "🇲🇽", placeholder: "5512345678", maxLength: 10 },
  ZA: { code: "+27", name: "South Africa", flag: "🇿🇦", placeholder: "821234567", maxLength: 9 },
  NZ: { code: "+64", name: "New Zealand", flag: "🇳🇿", placeholder: "211234567", maxLength: 9 },
  SA: { code: "+966", name: "Saudi Arabia", flag: "🇸🇦", placeholder: "512345678", maxLength: 9 },
  QA: { code: "+974", name: "Qatar", flag: "🇶🇦", placeholder: "33123456", maxLength: 8 },
  KW: { code: "+965", name: "Kuwait", flag: "🇰🇼", placeholder: "50012345", maxLength: 8 },
  BH: { code: "+973", name: "Bahrain", flag: "🇧🇭", placeholder: "36001234", maxLength: 8 },
  OM: { code: "+968", name: "Oman", flag: "🇴🇲", placeholder: "92123456", maxLength: 8 },
  SE: { code: "+46", name: "Sweden", flag: "🇸🇪", placeholder: "701234567", maxLength: 9 },
  NO: { code: "+47", name: "Norway", flag: "🇳🇴", placeholder: "41234567", maxLength: 8 },
  DK: { code: "+45", name: "Denmark", flag: "🇩🇰", placeholder: "20123456", maxLength: 8 },
  FI: { code: "+358", name: "Finland", flag: "🇫🇮", placeholder: "401234567", maxLength: 9 },
  IE: { code: "+353", name: "Ireland", flag: "🇮🇪", placeholder: "851234567", maxLength: 9 },
  PT: { code: "+351", name: "Portugal", flag: "🇵🇹", placeholder: "912345678", maxLength: 9 },
  PL: { code: "+48", name: "Poland", flag: "🇵🇱", placeholder: "512345678", maxLength: 9 },
  CH: { code: "+41", name: "Switzerland", flag: "🇨🇭", placeholder: "781234567", maxLength: 9 },
  AT: { code: "+43", name: "Austria", flag: "🇦🇹", placeholder: "6641234567", maxLength: 10 },
  BE: { code: "+32", name: "Belgium", flag: "🇧🇪", placeholder: "470123456", maxLength: 9 },
  RU: { code: "+7", name: "Russia", flag: "🇷🇺", placeholder: "9121234567", maxLength: 10 },
  HK: { code: "+852", name: "Hong Kong", flag: "🇭🇰", placeholder: "51234567", maxLength: 8 },
  TW: { code: "+886", name: "Taiwan", flag: "🇹🇼", placeholder: "912345678", maxLength: 9 },
};

export default function PhoneVerificationBanner({ user, onVerified, isRequired = false }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [localNumber, setLocalNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(user?.country || 'NP');
  const [showPhoneInput, setShowPhoneInput] = useState(!user?.phone);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
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

  // Get country data
  const countryData = COUNTRY_PHONE_DATA[selectedCountry] || COUNTRY_PHONE_DATA.NP;

  // Auto-dismiss banner when verification succeeds
  useEffect(() => {
    if (isVerified) {
      setIsDismissed(true);
    }
  }, [isVerified]);

  // Update when user prop changes
  useEffect(() => {
    if (user?.country && COUNTRY_PHONE_DATA[user.country]) {
      setSelectedCountry(user.country);
    }
    if (user?.phone) {
      setCurrentPhone(user.phone);
      setShowPhoneInput(false);
      
      // Extract local number from full phone
      const fullPhone = user.phone;
      for (const [code, data] of Object.entries(COUNTRY_PHONE_DATA)) {
        if (fullPhone.startsWith(data.code)) {
          setSelectedCountry(code);
          setLocalNumber(fullPhone.substring(data.code.length));
          break;
        }
      }
    }
  }, [user?.phone, user?.country]);

  // Don't show if dismissed
  if (isDismissed) return null;

  // Get full phone number
  const getFullPhoneNumber = () => {
    return countryData.code + localNumber;
  };

  // Handle local number input
  const handleLocalNumberChange = (e) => {
    let input = e.target.value;
    // Remove non-digits
    input = input.replace(/\D/g, '');
    // Remove leading zeros
    input = input.replace(/^0+/, '');
    // Limit to max length
    if (input.length > countryData.maxLength) {
      input = input.substring(0, countryData.maxLength);
    }
    setLocalNumber(input);
  };

  // Handle country change
  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    setShowCountryDropdown(false);
    setLocalNumber(''); // Clear number when country changes
  };

  // Handle saving phone number first, then send OTP
  const handleVerifyNow = async () => {
    // If no phone or phone input shown, save phone first
    if (!currentPhone || showPhoneInput) {
      if (!localNumber.trim()) {
        return;
      }
      
      const fullPhone = getFullPhoneNumber();
      
      setSavingPhone(true);
      try {
        const response = await api('/api/users', {
          method: 'PUT',
          body: { 
            name: user.name,
            email: user.email,
            phone: fullPhone 
          },
        });
        
        if (response.error) {
          // Use the hook's message display
          return;
        }
        
        // Phone saved, now send OTP
        setCurrentPhone(fullPhone);
        setShowPhoneInput(false);
        await sendCode(fullPhone);
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
                {/* Phone input with country selector */}
                {showPhoneInput && (
                  <div>
                    <div className={`flex rounded-lg border-2 overflow-hidden max-w-xs ${
                      isRequired
                        ? 'border-orange-300 focus-within:border-orange-500'
                        : 'border-blue-300 focus-within:border-blue-500'
                    }`}>
                      {/* Country Code Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors h-full"
                        >
                          <span className="text-base">{countryData.flag}</span>
                          <span className="font-medium text-gray-700 text-sm">{countryData.code}</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>

                        {/* Country Dropdown */}
                        {showCountryDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowCountryDropdown(false)}
                            />
                            <div className="absolute z-20 mt-1 left-0 w-56 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                              {Object.entries(COUNTRY_PHONE_DATA).map(([code, data]) => (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => handleCountryChange(code)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left ${
                                    selectedCountry === code ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <span>{data.flag}</span>
                                  <span className="flex-1 text-sm text-gray-700 truncate">{data.name}</span>
                                  <span className="text-xs text-gray-500">{data.code}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        value={localNumber}
                        onChange={handleLocalNumberChange}
                        placeholder={countryData.placeholder}
                        className="flex-1 px-3 py-2 outline-none bg-white text-sm"
                      />
                    </div>
                    
                    {/* Helper text */}
                    <p className="mt-1 text-xs text-gray-500">
                      {localNumber 
                        ? `Full number: ${countryData.code}${localNumber}`
                        : `Enter your ${countryData.name} mobile number`
                      }
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyNow}
                    disabled={isSending || savingPhone || (showPhoneInput && !localNumber.trim())}
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