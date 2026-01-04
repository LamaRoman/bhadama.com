"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import { Loader2, ArrowLeft, Shield, Check, AlertCircle, Calendar } from "lucide-react";
import PaymentLogos from "../../public/listings/components/PaymentLogos.jsx";

// Payment Gateway Logos (inline SVG - no image files needed)
const EsewaLogo = () => (
  <div className="w-16 h-10 bg-[#60BB46] rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm tracking-tight">eSewa</span>
  </div>
);

const KhaltiLogo = () => (
  <div className="w-16 h-10 bg-gradient-to-r from-[#5C2D91] to-[#7E3BE3] rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm tracking-tight">Khalti</span>
  </div>
);

const CardLogo = () => (
  <div className="w-16 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center gap-1.5 p-2">
    <div className="bg-[#1A1F71] rounded px-1.5 py-0.5">
      <span className="text-white text-[9px] font-bold tracking-wider">VISA</span>
    </div>
    <div className="flex -space-x-1.5">
      <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
      <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]" />
    </div>
  </div>
);

// Gateway configuration
const GATEWAY_CONFIG = {
  ESEWA: {
    name: "eSewa",
    description: "Pay with eSewa wallet",
    color: "#60BB46",
    Logo: EsewaLogo,
  },
  KHALTI: {
    name: "Khalti", 
    description: "Pay with Khalti wallet",
    color: "#5C2D91",
    Logo: KhaltiLogo,
  },
  DODO: {
    name: "Card Payment",
    description: "Visa, Mastercard & more",
    color: "#1A1F71",
    Logo: CardLogo,
  },
};

// Helper function to format dates properly
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Invalid date";
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date error";
  }
};

// Helper to calculate days between dates
const getDaysBetween = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    return 30; // default fallback
  }
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment");
  const { user, loading: authLoading } = useAuth();

  const [payment, setPayment] = useState(null);
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!paymentId) {
      router.push("/host/select-tier");
      return;
    }

    const fetchPayment = async () => {
      try {
        setLoading(true);
        
        const paymentData = await api(`/api/payments/${paymentId}`);
        if (paymentData.error) {
          toast.error(paymentData.error);
          router.push("/host/select-tier");
          return;
        }
        setPayment(paymentData.payment);

        const gatewaysData = await api(`/api/public/gateways?country=${user?.country || "NP"}`);
        if (!gatewaysData.error) {
          setGateways(gatewaysData.gateways || []);
          if (gatewaysData.gateways?.length === 1) {
            setSelectedGateway(gatewaysData.gateways[0].gateway);
          }
        }
      } catch (error) {
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPayment();
    }
  }, [paymentId, user, router]);

  const handlePayment = async () => {
    if (!selectedGateway) {
      toast.error("Please select a payment method");
      return;
    }

    setProcessing(true);
    try {
      const data = await api("/api/payments/initiate", {
        method: "POST",
        body: {
          paymentId: parseInt(paymentId),
          gateway: selectedGateway,
        },
      });

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.type === "redirect") {
        window.location.href = data.url;
      } else if (data.type === "form_redirect") {
        const form = document.createElement("form");
        form.method = data.method;
        form.action = data.url;
        
        Object.entries(data.params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Payment not found</p>
        </div>
      </div>
    );
  }

  // Calculate duration for display
  const periodDays = payment?.periodStart && payment?.periodEnd 
    ? getDaysBetween(payment.periodStart, payment.periodEnd)
    : 30;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-lg mx-auto px-4">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="ml-auto flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <Shield className="w-3 h-3" />
            <span>Secure</span>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
            <h1 className="text-xl font-bold">Complete Payment</h1>
            <p className="text-blue-100 text-sm mt-0.5">Final step to activate your plan</p>
          </div>

          {/* Order Summary */}
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {payment.subscription?.tier?.displayName || "Premium"} Plan
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {payment.subscription?.billingCycle?.toLowerCase() || "monthly"} subscription
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {payment.currency === "NPR" ? "Rs." : "$"}
                    {payment.amount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total amount
                  </p>
                </div>
              </div>
              
              {/* Date Period - Fixed display */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Period</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {formatDate(payment.periodStart)}
                    </span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(payment.periodEnd)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {periodDays} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Select Payment Method</h2>
            
            <div className="space-y-3">
              {gateways.map((gateway) => {
                const config = GATEWAY_CONFIG[gateway.gateway] || {
                  name: gateway.displayName || gateway.gateway,
                  description: "Secure payment",
                  color: "#6B7280",
                  Logo: () => <div className="w-16 h-10 bg-gray-500 rounded-lg" />,
                };
                const isSelected = selectedGateway === gateway.gateway;
                const Logo = config.Logo;
                
                return (
                  <button
                    key={gateway.gateway}
                    onClick={() => setSelectedGateway(gateway.gateway)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {/* Logo */}
                    <Logo />

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{config.name}</p>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {gateways.length === 0 && (
              <div className="text-center py-6">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No payment methods available</p>
              </div>
            )}
          </div>

          {/* Security Note & Accepted Cards */}
          <div className="px-5 pb-4">
            <div className="mb-3">
              <PaymentLogos size="sm" />
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Your payment is secured with 256-bit encryption</span>
            </div>
          </div>

          {/* Pay Button */}
          <div className="p-5 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handlePayment}
              disabled={!selectedGateway || processing}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {payment.currency === "NPR" ? "Rs." : "$"}
                  {payment.amount?.toLocaleString()}
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}