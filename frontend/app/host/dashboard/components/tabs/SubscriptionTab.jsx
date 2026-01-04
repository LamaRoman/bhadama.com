"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  Crown, Zap, Star, Rocket, Loader2,
  Calendar, TrendingUp, CreditCard, AlertCircle,
  ChevronRight, Check, X, Clock, Shield,
  ArrowUpRight, Image, BarChart3
} from "lucide-react";

const TIER_ICONS = { FREE: Star, BASIC: Zap, PRO: Crown, PREMIUM: Rocket };

const TIER_COLORS = {
  FREE: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  BASIC: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  PRO: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  PREMIUM: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
};

export default function SubscriptionTab({ onTabChange }) {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, limitsRes, paymentsRes] = await Promise.all([
        api("/api/host/tier/subscription").catch(() => ({ error: true })),
        api("/api/host/tier/limits").catch(() => ({ error: true })),
        api("/api/payments/history?limit=5").catch(() => ({ error: true, payments: [] })),
      ]);

      if (!subRes.error) {
        setSubscription(subRes);
      }
      if (!limitsRes.error) {
        setLimits(limitsRes);
      }
      if (!paymentsRes.error) {
        setPayments(paymentsRes.payments || []);
      }
    } catch (error) {
      console.error("Failed to load subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the current period ends.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await api("/api/host/tier/subscription/cancel", {
        method: "POST",
        body: { reason: "User requested cancellation" },
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Default values if API not connected yet
  const currentTier = subscription?.currentTier || { name: "FREE", displayName: "Free" };
  const sub = subscription?.subscription;
  const isFreeTier = subscription?.isFreeTier ?? true;
  const TierIcon = TIER_ICONS[currentTier.name] || Star;
  const tierColors = TIER_COLORS[currentTier.name] || TIER_COLORS.FREE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Subscription</h2>
        <p className="text-gray-600">Manage your plan and billing</p>
      </div>

      {/* Current Plan Card */}
      <div className={`rounded-2xl border-2 ${tierColors.border} overflow-hidden`}>
        <div className={`${tierColors.bg} p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow">
                <TierIcon className={`w-7 h-7 ${tierColors.text}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentTier.displayName || currentTier.name} Plan
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {sub?.status === "TRIAL" && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                      Trial
                    </span>
                  )}
                  {sub?.status === "ACTIVE" && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                  {sub?.status === "EXPIRED" && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                      Expired
                    </span>
                  )}
                  {!sub && isFreeTier && (
                    <span className="px-2 py-0.5 bg-gray-500 text-white text-xs font-medium rounded-full">
                      Free
                    </span>
                  )}
                  {sub?.cancelledAt && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                      Cancelling
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/host/select-tier")}
              className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              {isFreeTier ? "Upgrade" : "Change Plan"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Commission */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {limits?.commission || currentTier.commissionPercent || 10}%
              </p>
              <p className="text-sm text-gray-500">Commission</p>
            </div>

            {/* Billing Cycle */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {sub?.billingCycle?.toLowerCase() || "—"}
              </p>
              <p className="text-sm text-gray-500">Billing</p>
            </div>

            {/* Days Remaining */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {sub?.daysRemaining ?? (isFreeTier ? "∞" : "—")}
              </p>
              <p className="text-sm text-gray-500">Days Left</p>
            </div>

            {/* Renewal Date */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">
                {sub?.endDate ? formatDate(sub.endDate) : "Never"}
              </p>
              <p className="text-sm text-gray-500">
                {sub?.autoRenew ? "Renews" : "Expires"}
              </p>
            </div>
          </div>

          {/* Trial Notice */}
          {sub?.isInTrial && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Trial Period Active</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your trial ends on {formatDate(sub.trialEndDate)}. 
                    Add a payment method to continue after trial.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expiring Soon Warning */}
          {sub?.daysRemaining && sub.daysRemaining <= 7 && sub.daysRemaining > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Subscription Expiring Soon</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your subscription expires in {sub.daysRemaining} days. 
                    {sub.autoRenew ? " It will auto-renew." : " Please renew to continue."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Limits */}
      {limits?.limits && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage & Limits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Listings */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Active Listings</span>
                <span className="text-sm font-medium">
                  {limits.limits.listings?.used || 0} / {limits.limits.listings?.unlimited ? "∞" : limits.limits.listings?.max || 2}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    limits.limits.listings?.canCreate !== false ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ 
                    width: limits.limits.listings?.unlimited 
                      ? "20%" 
                      : `${Math.min(100, ((limits.limits.listings?.used || 0) / (limits.limits.listings?.max || 2)) * 100)}%` 
                  }}
                />
              </div>
              {limits.limits.listings?.canCreate === false && (
                <p className="text-xs text-red-600 mt-2">Limit reached - upgrade to add more</p>
              )}
            </div>

            {/* Blog Posts */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Blog Posts (this month)</span>
                <span className="text-sm font-medium">
                  {limits.limits.blogPosts?.used || 0} / {limits.limits.blogPosts?.unlimited ? "∞" : limits.limits.blogPosts?.max || 2}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    limits.limits.blogPosts?.canCreate !== false ? "bg-blue-500" : "bg-red-500"
                  }`}
                  style={{ 
                    width: limits.limits.blogPosts?.unlimited 
                      ? "20%" 
                      : `${Math.min(100, ((limits.limits.blogPosts?.used || 0) / (limits.limits.blogPosts?.max || 2)) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Photos per Listing */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Photos per Listing</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{limits.limits.photosPerListing || 5}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isFreeTier ? (
          <button
            onClick={() => router.push("/host/select-tier")}
            className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Upgrade Your Plan</p>
                <p className="text-sm text-purple-200">Get more features & lower commission</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => router.push("/host/select-tier")}
            className="p-4 bg-white border rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-gray-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Change Plan</p>
                <p className="text-sm text-gray-500">Upgrade or downgrade</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}

        <button
          onClick={() => onTabChange ? onTabChange("support") : router.push("/host/dashboard?tab=support")}
          className="p-4 bg-white border rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-gray-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Need Help?</p>
              <p className="text-sm text-gray-500">Contact support</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </h3>
          <button 
            onClick={() => router.push("/host/payments")}
            className="text-sm text-blue-600 hover:underline"
          >
            View All
          </button>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payment.status === "COMPLETED" ? "bg-green-100" : 
                    payment.status === "PENDING" ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    {payment.status === "COMPLETED" ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : payment.status === "PENDING" ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.description}</p>
                    <p className="text-sm text-gray-500">
                      {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {payment.currency === "NPR" ? "Rs." : "$"}
                    {payment.amount?.toLocaleString()}
                  </p>
                  <p className={`text-xs font-medium ${
                    payment.status === "COMPLETED" ? "text-green-600" : 
                    payment.status === "PENDING" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No payment history yet</p>
            <p className="text-sm mt-1">Payments will appear here after you subscribe to a plan</p>
          </div>
        )}
      </div>

      {/* Cancel Subscription */}
      {!isFreeTier && sub && !sub.cancelledAt && (
        <div className="border-t pt-6">
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            You'll retain access until the end of your current billing period.
          </p>
        </div>
      )}
    </div>
  );
}