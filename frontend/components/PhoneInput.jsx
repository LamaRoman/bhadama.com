"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";

/**
 * COUNTRIES DATA with phone formatting rules
 */
export const COUNTRY_PHONE_DATA = {
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

/**
 * PhoneInput Component
 * 
 * Automatically adds country code based on user's country
 * 
 * Usage:
 * <PhoneInput
 *   value={phone}
 *   onChange={setPhone}
 *   userCountry="AU"
 *   error={errors.phone}
 * />
 */
export default function PhoneInput({
  value = "",
  onChange,
  userCountry = "NP",
  error = null,
  disabled = false,
  className = "",
}) {
  const [localNumber, setLocalNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(userCountry);
  const [showDropdown, setShowDropdown] = useState(false);

  const countryData = COUNTRY_PHONE_DATA[selectedCountry] || COUNTRY_PHONE_DATA.NP;

  // Initialize local number from value (strip country code if present)
  useEffect(() => {
    if (value) {
      let cleanValue = value.replace(/\s/g, "");
      
      // Check if value starts with any country code
      for (const [code, data] of Object.entries(COUNTRY_PHONE_DATA)) {
        if (cleanValue.startsWith(data.code)) {
          setSelectedCountry(code);
          setLocalNumber(cleanValue.substring(data.code.length));
          return;
        }
      }
      
      // If no country code found, assume it's a local number
      setLocalNumber(cleanValue.replace(/^\+/, ""));
    }
  }, []);

  // Update parent when local number or country changes
  useEffect(() => {
    if (localNumber) {
      const fullNumber = countryData.code + localNumber;
      onChange(fullNumber);
    } else {
      onChange("");
    }
  }, [localNumber, selectedCountry]);

  // Handle input change
  const handleInputChange = (e) => {
    let input = e.target.value;
    
    // Remove non-digits
    input = input.replace(/\D/g, "");
    
    // Remove leading zeros
    input = input.replace(/^0+/, "");
    
    // Limit to max length
    if (input.length > countryData.maxLength) {
      input = input.substring(0, countryData.maxLength);
    }
    
    setLocalNumber(input);
  };

  // Handle country change
  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    setShowDropdown(false);
    // Clear number when country changes (different format)
    setLocalNumber("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`flex rounded-xl border-2 overflow-hidden ${
        error ? "border-red-300 bg-red-50" : "border-stone-200 focus-within:border-emerald-500"
      } transition-colors`}>
        
        {/* Country Code Selector */}
        <button
          type="button"
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-3 bg-stone-50 border-r border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">{countryData.flag}</span>
          <span className="font-medium text-stone-700">{countryData.code}</span>
          <ChevronDown className="w-4 h-4 text-stone-400" />
        </button>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="tel"
            value={localNumber}
            onChange={handleInputChange}
            placeholder={countryData.placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Country Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-stone-200 rounded-xl shadow-lg">
            {Object.entries(COUNTRY_PHONE_DATA).map(([code, data]) => (
              <button
                key={code}
                type="button"
                onClick={() => handleCountryChange(code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors ${
                  selectedCountry === code ? "bg-emerald-50" : ""
                }`}
              >
                <span className="text-lg">{data.flag}</span>
                <span className="flex-1 text-left text-stone-700">{data.name}</span>
                <span className="text-stone-500 font-medium">{data.code}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Helper Text */}
      {!error && localNumber && (
        <p className="text-stone-500 text-xs mt-1">
          Full number: {countryData.code}{localNumber}
        </p>
      )}
    </div>
  );
}


/**
 * Utility function to normalize phone number
 * Call this before saving to database
 */
export function normalizePhoneNumber(localNumber, countryCode) {
  const country = COUNTRY_PHONE_DATA[countryCode];
  if (!country) return localNumber;
  
  // Remove non-digits and leading zeros
  const cleaned = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  
  return country.code + cleaned;
}

/**
 * Utility function to extract local number from full phone
 */
export function extractLocalNumber(fullPhone, countryCode) {
  const country = COUNTRY_PHONE_DATA[countryCode];
  if (!country || !fullPhone) return "";
  
  if (fullPhone.startsWith(country.code)) {
    return fullPhone.substring(country.code.length);
  }
  
  return fullPhone.replace(/^\+/, "");
}

/**
 * Get country data by code
 */
export function getCountryPhoneData(countryCode) {
  return COUNTRY_PHONE_DATA[countryCode] || COUNTRY_PHONE_DATA.NP;
}