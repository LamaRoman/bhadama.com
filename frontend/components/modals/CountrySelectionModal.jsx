"use client";

import { useState } from "react";
import { Globe, ChevronDown, X, ArrowRight, Loader2 } from "lucide-react";
import { COUNTRIES_WITH_NEPAL_FIRST } from "../../utils/countries";

/**
 * CountrySelectionModal
 * 
 * Shows when user doesn't have a country set (existing users)
 * Can be triggered from:
 * 1. Booking flow (when user tries to book)
 * 2. Profile page (prompt)
 * 3. After login (if country is null)
 * 
 * Usage:
 * <CountrySelectionModal
 *   isOpen={showCountryModal}
 *   onClose={() => setShowCountryModal(false)}
 *   onSelect={handleCountrySelect}
 * />
 */
export default function CountrySelectionModal({ isOpen, onClose, onSelect, loading = false }) {
  const [selectedCountry, setSelectedCountry] = useState("NP");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCountry) return;
    
    setIsSubmitting(true);
    try {
      await onSelect(selectedCountry);
    } finally {
      setIsSubmitting(false);
    }
  };

  const country = COUNTRIES_WITH_NEPAL_FIRST.find(c => c.code === selectedCountry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold">Select Your Country</h2>
          <p className="text-emerald-100 mt-1">
            We need this to show you the right payment options
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Country Dropdown */}
          <div className="relative mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Country
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full pl-4 pr-10 py-4 rounded-xl border-2 border-gray-200 appearance-none bg-white focus:border-emerald-500 focus:ring-0 outline-none transition-colors cursor-pointer text-lg"
              >
                {COUNTRIES_WITH_NEPAL_FIRST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Payment Methods Preview */}
          {country && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Available payment methods in {country.name}:
              </p>
              <div className="flex flex-wrap gap-2">
                {country.code === "NP" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      eSewa
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Khalti
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Card
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Credit/Debit Card (Visa, Mastercard)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedCountry || isSubmitting || loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            You can change this later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}