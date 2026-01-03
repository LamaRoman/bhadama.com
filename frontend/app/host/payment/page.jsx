"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import { Loader2, ArrowLeft, Shield, Check, AlertCircle, CreditCard } from "lucide-react";

// Payment Gateway Logos
const EsewaLogo = () => (
  <div className="w-full h-full bg-[#60BB46] rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm tracking-tight">eSewa</span>
  </div>
);

const KhaltiLogo = () => (
  <div className="w-full h-full bg-[#5C2D91] rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm tracking-tight">Khalti</span>
  </div>
);

const CardLogo = () => (
  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center gap-1 p-2">
    {/* Visa */}
    <div className="bg-[#1A1F71] rounded px-1.5 py-0.5">
      <span className="text-white text-[8px] font-bold italic">VISA</span>
    </div>
    {/* Mastercard circles */}
    <div className="flex -space-x-1.5">
      <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
      <div className="w-4 h-4 rounded-full bg-[#F79E1B]" />
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
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, Amex, Discover & more",
    color: "#1A1F71",
    Logo: CardLogo,
  },
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
        setPayment(paymentData.payment);

        const gatewaysData = await api(
          `/api/public/gateways?country=${user?.country || "NP"}`
        );
        setGateways(gatewaysData.gateways || []);
        if (gatewaysData.gateways?.length === 1) {
          setSelectedGateway(gatewaysData.gateways[0].gateway);
        }
      } catch (error) {
        console.error("Payment fetch error:", error);
        toast.error(error.message || "Failed to load payment details");
        router.push("/host/select-tier");
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
      console.error("Payment initiation error:", error);
      toast.error(error.message || "Failed to initiate payment");
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
          <button
            onClick={() => router.push("/host/select-tier")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Toaster position="top-right" />

      <div className="max-w-lg mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-2xl font-bold">Complete Payment</h1>
            <p className="text-blue-100 mt-1">Secure checkout</p>
          </div>

          {/* Order Summary */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.subscription?.tier?.displayName || payment.description || "Subscription"} Plan
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.subscription?.billingCycle?.toLowerCase() || "monthly"} subscription
                  </p>
                  {/* Show proration info if applicable */}
                  {payment.type === "PRORATED" && payment.proratedCredit > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Includes {payment.currency === "NPR" ? "Rs." : "$"}
                      {payment.proratedCredit?.toLocaleString()} credit from current plan
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {payment.currency === "NPR" ? "Rs." : "$"}
                  {payment.amount?.toLocaleString()}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Period: {new Date(payment.periodStart).toLocaleDateString()} -{" "}
                {new Date(payment.periodEnd).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Select Payment Method
            </h2>

            <div className="space-y-3">
              {gateways.map((gateway) => {
                const config = GATEWAY_CONFIG[gateway.gateway] || {
                  name: gateway.displayName,
                  description: "Pay securely",
                  color: "#6B7280",
                  Logo: () => (
                    <div className="w-full h-full bg-gray-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                  ),
                };
                const isSelected = selectedGateway === gateway.gateway;
                const Logo = config.Logo;

                return (
                  <button
                    key={gateway.gateway}
                    onClick={() => setSelectedGateway(gateway.gateway)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Logo */}
                    <div className="w-14 h-10 flex-shrink-0">
                      <Logo />
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{config.name}</p>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {gateways.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payment methods available</p>
              </div>
            )}
          </div>

          {/* Security Note */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <Shield className="w-4 h-4" />
              <span>Your payment is secure and encrypted</span>
            </div>

            {/* Accepted Cards - Show only if DODO is available */}
            {gateways.some((g) => g.gateway === "DODO") && (
              <div className="flex items-center justify-center gap-3 mt-3">
                {/* Visa */}
                <div className="px-2 py-1 bg-white border rounded">
                  <span className="text-[#1A1F71] font-bold text-xs italic">VISA</span>
                </div>
                {/* Mastercard */}
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                  <div className="w-5 h-5 rounded-full bg-[#F79E1B]" />
                </div>
                {/* Amex */}
                <div className="px-2 py-1 bg-[#006FCF] rounded">
                  <span className="text-white font-bold text-[8px]">AMEX</span>
                </div>
                {/* Discover */}
                <div className="px-2 py-1 bg-[#FF6000] rounded">
                  <span className="text-white font-bold text-[8px]">DISCOVER</span>
                </div>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <div className="p-6 bg-gray-50">
            <button
              onClick={handlePayment}
              disabled={!selectedGateway || processing}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {payment.currency === "NPR" ? "Rs." : "$"}
                  {payment.amount?.toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}