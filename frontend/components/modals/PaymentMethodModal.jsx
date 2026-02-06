"use client";

import { useState, useRef } from "react";
import { 
  X, 
  ArrowRight, 
  Loader2, 
  Shield, 
  CreditCard,
  Smartphone,
  CheckCircle2
} from "lucide-react";

/**
 * PaymentMethodModal - FIXED VERSION
 * 
 * FIXES APPLIED:
 * 1. ✅ Added useRef to prevent double submission
 * 2. ✅ Better loading state management
 * 3. ✅ Added disabled state during external loading
 * 
 * Shows payment method options based on user's country
 * Nepal users: eSewa, Khalti, Card
 * International users: Card only
 */

// Payment gateway configurations
const PAYMENT_METHODS = {
  ESEWA: {
    id: "ESEWA",
    name: "eSewa",
    description: "Pay with eSewa wallet",
    icon: EsewaLogo,
    color: "#60BB46",
    bgColor: "bg-[#60BB46]/10",
    borderColor: "border-[#60BB46]",
    countries: ["NP"],
  },
  KHALTI: {
    id: "KHALTI",
    name: "Khalti",
    description: "Pay with Khalti wallet",
    icon: KhaltiLogo,
    color: "#5C2D91",
    bgColor: "bg-[#5C2D91]/10",
    borderColor: "border-[#5C2D91]",
    countries: ["NP"],
  },
  CARD: {
    id: "CARD",
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, Amex & more",
    icon: CardLogo,
    color: "#1A1F71",
    bgColor: "bg-gray-100",
    borderColor: "border-blue-500",
    countries: ["*"], // Available everywhere
  },
};

// Logo Components
function EsewaLogo({ className }) {
  return (
    <div className={`w-12 h-12 bg-[#60BB46] rounded-xl flex items-center justify-center ${className}`}>
      <span className="text-white font-bold text-sm">eSewa</span>
    </div>
  );
}

function KhaltiLogo({ className }) {
  return (
    <div className={`w-12 h-12 bg-gradient-to-br from-[#5C2D91] to-[#7E3BE3] rounded-xl flex items-center justify-center ${className}`}>
      <span className="text-white font-bold text-sm">Khalti</span>
    </div>
  );
}

function CardLogo({ className }) {
  return (
    <div className={`w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center gap-1 ${className}`}>
      {/* Visa */}
      <div className="bg-[#1A1F71] rounded px-1 py-0.5">
        <span className="text-white text-[7px] font-bold">VISA</span>
      </div>
      {/* Mastercard circles */}
      <div className="flex -space-x-1">
        <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
        <div className="w-3 h-3 rounded-full bg-[#F79E1B]" />
      </div>
    </div>
  );
}

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  userCountry = "NP",
  amount = 0,
  currency = "NPR",
  loading = false 
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ FIX: Use ref to prevent double submission
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  // Filter payment methods based on user's country
  const availableMethods = Object.values(PAYMENT_METHODS).filter(method => {
    return method.countries.includes("*") || method.countries.includes(userCountry);
  });

  const handleSubmit = async () => {
    // ✅ FIX: Double check using both state and ref
    if (!selectedMethod || isSubmitting || isSubmittingRef.current || loading) {
      return;
    }
    
    // ✅ FIX: Set ref immediately to prevent any race conditions
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    try {
      await onSelect(selectedMethod);
    } catch (error) {
      // Reset on error so user can try again
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
    // Note: Don't reset isSubmitting on success - the modal will close
    // and the page will navigate away
  };

  // ✅ FIX: Handle close - reset state
  const handleClose = () => {
    if (isSubmitting || loading) return; // Don't allow close while submitting
    
    setSelectedMethod(null);
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    onClose();
  };

  const formatAmount = (amt) => {
    if (currency === "NPR") {
      return `Rs. ${amt.toLocaleString()}`;
    }
    return `$${amt.toLocaleString()}`;
  };

  // ✅ FIX: Combined loading state
  const isDisabled = isSubmitting || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
          <button
            onClick={handleClose}
            disabled={isDisabled}
            className={`absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Choose Payment Method</h2>
              <p className="text-emerald-100 text-sm">Select how you'd like to pay</p>
            </div>
          </div>
          
          {/* Amount Display */}
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
            <span className="text-emerald-100">Total Amount</span>
            <span className="text-2xl font-bold">{formatAmount(amount)}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-6">
          <div className="space-y-3">
            {availableMethods.map((method) => {
              const IconComponent = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => !isDisabled && setSelectedMethod(method.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isSelected
                      ? `${method.borderColor} ${method.bgColor} shadow-lg`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <IconComponent />
                  
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-gray-300"
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secured with 256-bit SSL encryption</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedMethod || isDisabled}
            className={`w-full mt-6 py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMethod && !isDisabled
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {isDisabled ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedMethod ? `Pay ${formatAmount(amount)}` : "Select a payment method"}
                {selectedMethod && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>

          {/* Cancel Link */}
          <button
            onClick={handleClose}
            disabled={isDisabled}
            className={`w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}