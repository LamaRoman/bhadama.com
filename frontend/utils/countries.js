// ============================================
// COUNTRIES LIST
// ============================================
// Use this in both frontend and backend
// File: src/data/countries.js (backend) or utils/countries.js (frontend)
// ============================================

export const COUNTRIES = [
  { code: "NP", name: "Nepal", currency: "NPR", flag: "🇳🇵" },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵" },
  { code: "CN", name: "China", currency: "CNY", flag: "🇨🇳" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", currency: "MYR", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", currency: "THB", flag: "🇹🇭" },
  { code: "BD", name: "Bangladesh", currency: "BDT", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", flag: "🇱🇰" },
  { code: "PK", name: "Pakistan", currency: "PKR", flag: "🇵🇰" },
  { code: "KR", name: "South Korea", currency: "KRW", flag: "🇰🇷" },
  { code: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
  { code: "IT", name: "Italy", currency: "EUR", flag: "🇮🇹" },
  { code: "ES", name: "Spain", currency: "EUR", flag: "🇪🇸" },
  { code: "BR", name: "Brazil", currency: "BRL", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", currency: "MXN", flag: "🇲🇽" },
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦" },
  { code: "NZ", name: "New Zealand", currency: "NZD", flag: "🇳🇿" },
  { code: "IE", name: "Ireland", currency: "EUR", flag: "🇮🇪" },
  { code: "SE", name: "Sweden", currency: "SEK", flag: "🇸🇪" },
  { code: "NO", name: "Norway", currency: "NOK", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", currency: "DKK", flag: "🇩🇰" },
  { code: "FI", name: "Finland", currency: "EUR", flag: "🇫🇮" },
  { code: "CH", name: "Switzerland", currency: "CHF", flag: "🇨🇭" },
  { code: "AT", name: "Austria", currency: "EUR", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", currency: "EUR", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", currency: "EUR", flag: "🇵🇹" },
  { code: "PL", name: "Poland", currency: "PLN", flag: "🇵🇱" },
  { code: "RU", name: "Russia", currency: "RUB", flag: "🇷🇺" },
  { code: "QA", name: "Qatar", currency: "QAR", flag: "🇶🇦" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", flag: "🇸🇦" },
  { code: "KW", name: "Kuwait", currency: "KWD", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", currency: "BHD", flag: "🇧🇭" },
  { code: "OM", name: "Oman", currency: "OMR", flag: "🇴🇲" },
  { code: "PH", name: "Philippines", currency: "PHP", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", currency: "IDR", flag: "🇮🇩" },
  { code: "VN", name: "Vietnam", currency: "VND", flag: "🇻🇳" },
  { code: "HK", name: "Hong Kong", currency: "HKD", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", currency: "TWD", flag: "🇹🇼" },
].sort((a, b) => a.name.localeCompare(b.name));

// Nepal at top for convenience (most common)
export const COUNTRIES_WITH_NEPAL_FIRST = [
  { code: "NP", name: "Nepal", currency: "NPR", flag: "🇳🇵" },
  ...COUNTRIES.filter(c => c.code !== "NP")
];

// Helper functions
export const getCountryByCode = (code) => {
  return COUNTRIES.find(c => c.code === code);
};

export const isNepalUser = (countryCode) => {
  return countryCode === "NP";
};

export const getCurrencyForCountry = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return country?.currency || "USD";
};

// For payment gateway filtering
export const getAvailablePaymentMethods = (countryCode) => {
  if (countryCode === "NP") {
    return ["ESEWA", "KHALTI", "CARD"];
  }
  return ["CARD"]; // International users only get card
};

export default COUNTRIES;