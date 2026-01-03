"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function UpgradePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newTierId = searchParams.get("tierId");
  const billingCycle = searchParams.get("cycle") || "MONTHLY";
  
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!newTierId) {
      router.push("/host/select-tier");
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await api(
          `/api/host/tier/subscription/upgrade-preview?newTierId=${newTierId}&billingCycle=${billingCycle}`
        );
        
        setPreview(data);
      } catch (err) {
        console.error("Upgrade preview error:", err);
        setError(err.message || "Failed to load upgrade preview");
        toast.error(err.message || "Failed to load upgrade preview");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPreview();
    }
  }, [newTierId, billingCycle, user, router]);

  const handleConfirmUpgrade = async () => {
    setProcessing(true);
    try {
      const data = await api("/api/host/tier/subscription/upgrade", {
        method: "POST",
        body: {
          newTierId: parseInt(newTierId),
          billingCycle,
        },
      });

      if (data.requiresPayment) {
        router.push(`/host/payment?payment=${data.payment.id}`);
      } else {
        toast.success(data.message || "Upgrade successful!");
        router.push("/host/dashboard");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      toast.error(err.message || "Failed to process upgrade");
    } finally {
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

  if (error || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Preview</h2>
          <p className="text-gray-600 mb-4">{error || "Something went wrong"}</p>
          <button
            onClick={() => router.push("/host/select-tier")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }
    

  const currency = preview.currency === "USD" ? "$" : "Rs.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <Toaster position="top-right" />

      <div className="max-w-2xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Upgrade Your Plan</h1>
          <p className="text-gray-600 mt-2">
            Review your upgrade details before confirming
          </p>
        </div>

        {/* Plan Comparison */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Plan Change</h2>
            
            <div className="flex items-center justify-between">
              {/* Current Plan */}
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-gray-600 font-bold text-lg">
                    {preview.currentTier.displayName.charAt(0)}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">
                  {preview.currentTier.displayName}
                </p>
                <p className="text-sm text-gray-500">
                  {currency}{preview.currentTier.price?.toLocaleString()}/{billingCycle.toLowerCase().replace("ly", "")}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 px-4">
                <div className="w-8 h-0.5 bg-gray-300" />
                <ArrowRight className="w-5 h-5 text-purple-600" />
                <div className="w-8 h-0.5 bg-gray-300" />
              </div>

              {/* New Plan */}
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-semibold text-purple-700">
                  {preview.newTier.displayName}
                </p>
                <p className="text-sm text-purple-600">
                  {currency}{preview.newTier.price?.toLocaleString()}/{billingCycle.toLowerCase().replace("ly", "")}
                </p>
              </div>
            </div>
          </div>

          {/* New Features */}
          <div className="p-6 bg-purple-50 border-b border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-3">
              What you'll get with {preview.newTier.displayName}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-purple-800">
                <Check className="w-4 h-4 text-purple-600" />
                <span>
                  <strong>{preview.newTier.maxListings === -1 ? "Unlimited" : preview.newTier.maxListings}</strong> listings
                </span>
              </li>
              {preview.newTier.features?.verifiedBadge && (
                <li className="flex items-center gap-2 text-sm text-purple-800">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span>Verified badge on your profile</span>
                </li>
              )}
              {preview.currentTier.name !== "FREE" && (
                <li className="flex items-center gap-2 text-sm text-purple-800">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span>
                    Lower commission ({preview.newTier.features?.commissionPercent || 5}% vs {preview.currentTier.features?.commissionPercent || 7}%)
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Proration Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Payment Breakdown</h2>
            </div>

            <div className="space-y-4">
              {/* Days Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <Calendar className="w-4 h-4" />
                <span>
                  {preview.proration.summary.daysRemaining} days remaining in your current billing period
                </span>
              </div>

              {/* Credit */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Credit from {preview.currentTier.displayName}</p>
                  <p className="text-sm text-gray-500">
                    {preview.proration.credits.description}
                  </p>
                </div>
                <span className="font-semibold text-green-600">
                  -{preview.proration.credits.formatted}
                </span>
              </div>

              {/* New Plan Cost */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{preview.newTier.displayName} Plan</p>
                  <p className="text-sm text-gray-500">
                    {preview.proration.charges.description}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  +{preview.proration.charges.formatted}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="font-bold text-gray-900">Amount Due Today</p>
                </div>
                <span className="text-2xl font-bold text-purple-700">
                  {preview.proration.total.formatted}
                </span>
              </div>
            </div>
          </div>

          {/* Next Billing */}
          <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Next billing on {new Date(preview.subscriptionEndDate).toLocaleDateString()}
              </span>
              <span className="font-medium text-gray-900">
                {currency}{preview.newTier.price?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmUpgrade}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm Upgrade - Pay {preview.proration.total.formatted}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By confirming, you agree to our Terms of Service. Your plan will be upgraded immediately.
        </p>
      </div>
    </div>
  );
}