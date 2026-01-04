// File: TierSelectionPage.js - Updated without weekly

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext.js";
import { api } from "../../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import {
  Check, X, Crown, Zap, Star, Rocket,
  Loader2, ChevronRight, Info, Gift,
  TrendingUp, TrendingDown, ArrowLeft,
  AlertTriangle, CheckCircle2
} from "lucide-react";

// Tier icons
const TIER_ICONS = {
  FREE: Star,
  BASIC: Zap,
  PRO: Crown,
  PREMIUM: Rocket,
};

// Tier colors
const TIER_COLORS = {
  FREE: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
    button: "bg-gray-600 hover:bg-gray-700",
    buttonDowngrade: "bg-gray-500 hover:bg-gray-600",
    badge: "bg-gray-100 text-gray-600",
    iconBg: "bg-gray-200",
  },
  BASIC: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
    buttonDowngrade: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-100 text-blue-600",
    iconBg: "bg-blue-200",
  },
  PRO: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700",
    buttonDowngrade: "bg-purple-500 hover:bg-purple-600",
    badge: "bg-purple-100 text-purple-600",
    iconBg: "bg-purple-200",
    popular: true,
  },
  PREMIUM: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    buttonDowngrade: "bg-amber-500 hover:bg-amber-600",
    badge: "bg-amber-100 text-amber-600",
    iconBg: "bg-amber-200",
  },
};

// Tier order for comparison
const TIER_ORDER = {
  FREE: 1,
  BASIC: 2,
  PRO: 3,
  PREMIUM: 4,
};

// Feature list for comparison
const FEATURE_LIST = [
  { key: "maxListings", label: "Active Listings" },
  { key: "commissionPercent", label: "Platform Commission", suffix: "%" },
  { key: "maxPhotosPerListing", label: "Photos per Listing" },
  { key: "featuredListingSlots", label: "Featured Slots" },
  { key: "maxBlogPostsPerMonth", label: "Blog Posts/Month" },
  { key: "verifiedBadge", label: "Verified Badge", boolean: true },
  { key: "prioritySearch", label: "Priority in Search" },
  { key: "analytics", label: "Analytics" },
  { key: "calendarSync", label: "Calendar Sync", boolean: true },
  { key: "instantBooking", label: "Instant Booking", boolean: true },
];

export default function TierSelectionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState("MONTHLY");
  const [currency, setCurrency] = useState("NPR");
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const userCountry = user?.country || "NP";
    setCurrency(userCountry === "NP" ? "NPR" : "USD");
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tiers (public, should work)
        let tiersResult = [];
        try {
          const tiersData = await api(`/api/public/tiers?currency=${currency}`);
          tiersResult = tiersData.tiers || [];
        } catch (err) {
          console.error("Failed to fetch tiers:", err);
        }
        setTiers(tiersResult);
        
        // Fetch current subscription (may fail if not logged in properly)
        try {
          const subscriptionData = await api("/api/host/tier/subscription");
          setCurrentSubscription(subscriptionData);
        } catch (err) {
          console.error("Failed to fetch subscription:", err);
          // Not critical, user might not have a subscription
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load pricing");
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [currency, user]);

  // Get current tier name
  const currentTierName = currentSubscription?.currentTier?.name || 
                          currentSubscription?.subscription?.tier?.name || 
                          user?.currentTier || 
                          "FREE";

  // Determine tier relationship (upgrade, downgrade, current)
  const getTierRelation = (tierName) => {
    const currentOrder = TIER_ORDER[currentTierName] || 1;
    const tierOrder = TIER_ORDER[tierName] || 1;
    
    if (tierOrder === currentOrder) return "current";
    if (tierOrder > currentOrder) return "upgrade";
    return "downgrade";
  };

  // Handle tier selection - FIXED VERSION
  const handleSelectTier = async (tier) => {
    console.log("🚀 handleSelectTier called with tier:", tier);
    
    if (processing) return;
    
    const relation = getTierRelation(tier.name);
    console.log("Relation to current tier:", relation);
    
    // If it's the current tier, do nothing
    if (relation === "current") {
      toast.error("You're already on this plan");
      return;
    }
    
    setProcessing(tier.id);

    try {
      if (relation === "upgrade") {
        // For upgrades, go to upgrade preview page
        router.push(`/host/upgrade-preview?tierId=${tier.id}&cycle=${selectedBillingCycle}`);
        return;
      }
      
      // For downgrades, get preview first
      let preview;
      try {
        preview = await api(
          `/api/host/tier/subscription/downgrade-preview?newTierId=${tier.id}`
        );
      } catch (err) {
        toast.error(err.message || "Failed to load downgrade preview");
        setProcessing(null);
        return;
      }
      
      // If there are excess listings, show warning and confirm
      if (preview.listingImpact?.excessCount > 0) {
        const confirmed = window.confirm(
          `⚠️ Downgrade Warning\n\n` +
          `You have ${preview.listingImpact.currentCount} listings, but ${tier.displayName} allows only ${preview.listingImpact.newLimit}.\n\n` +
          `${preview.listingImpact.excessCount} listing(s) will become read-only and you'll have ${preview.gracePeriod.days} days to choose which ones to keep.\n\n` +
          `Do you want to continue?`
        );
        
        if (!confirmed) {
          setProcessing(null);
          return;
        }
      }
      
      // Execute downgrade
      let result;
      try {
        result = await api("/api/host/tier/subscription/downgrade", {
          method: "POST",
          body: { newTierId: tier.id },
        });
      } catch (err) {
        toast.error(err.message || "Failed to downgrade");
        setProcessing(null);
        return;
      }
      
      toast.success(result.message || "Downgrade successful!");
      
      // Redirect based on whether listing selection is needed
      if (result.gracePeriod) {
        router.push("/host/listings/select-to-keep");
      } else {
        router.push("/host/dashboard");
      }
    } catch (err) {
      console.error("Tier selection error:", err);
      toast.error(err.message || "Failed to process request");
      setProcessing(null);
    }
  };

  // Handle new subscription (no current subscription) - UPDATED VERSION
  const handleNewSubscription = async (tier) => {
    console.log("🚀 handleNewSubscription called with tier:", tier);
    console.log("Selected billing cycle:", selectedBillingCycle);
    console.log("Currency:", currency);
    
    if (processing) return;
    setProcessing(tier.id);

    try {
      // DEBUG: Log the request
      console.log("Making API call to /api/host/tier/subscription/select");
      console.log("Request body:", {
        tierId: tier.id,
        billingCycle: selectedBillingCycle,
        currency,
      });

      const data = await api("/api/host/tier/subscription/select", {
        method: "POST",
        body: {
          tierId: tier.id,
          billingCycle: selectedBillingCycle,
          currency,
        },
      });

      console.log("API Response:", data);

      if (data.error) {
        toast.error(data.error);
        setProcessing(null);
        return;
      }

      if (data.requiresPayment) {
        console.log("Payment required, redirecting to payment page");
        console.log("Payment ID:", data.payment?.id);
        router.push(`/host/payment?payment=${data.payment?.id || data.paymentId}`);
      } else {
        toast.success(data.message || "Subscription activated!");
        router.push("/host/dashboard");
      }
    } catch (error) {
      console.error("Payment selection error:", error);
      toast.error(error.message || "Failed to select tier");
    } finally {
      setProcessing(null);
    }
  };

  const formatValue = (feature, value) => {
    if (value === -1 || value === "Unlimited") return "Unlimited";
    if (feature.boolean) return value ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-gray-300" />;
    if (feature.suffix) return `${value}${feature.suffix}`;
    if (value === "none") return <X className="w-5 h-5 text-gray-300" />;
    if (value === "views_only") return "Views Only";
    if (value === "basic") return "Basic";
    if (value === "detailed") return "Detailed";
    if (value === "full_export") return "Full + Export";
    if (value === "slight_boost") return "Slight Boost";
    if (value === "top_priority") return "Top Priority";
    return value;
  };

  // Render the action button based on tier relationship
  const renderActionButton = (tier, colors, isProcessing) => {
    const relation = getTierRelation(tier.name);
    const hasSubscription = currentSubscription?.subscription !== null;
    
    // New user without subscription
    if (!hasSubscription) {
      return (
        <button
          onClick={() => handleNewSubscription(tier)}
          disabled={isProcessing || processing}
          className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all ${colors.button} disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : tier.trialDays > 0 ? (
            <>
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </>
          ) : tier.name === "FREE" ? (
            "Get Started Free"
          ) : (
            <>
              Select Plan
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      );
    }
    
    // Current plan
    if (relation === "current") {
      return (
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5" />
          Current Plan
        </button>
      );
    }
    
    // Upgrade
    if (relation === "upgrade") {
      return (
        <button
          onClick={() => handleSelectTier(tier)}
          disabled={isProcessing || processing}
          className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all ${colors.button} disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              Upgrade
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      );
    }
    
    // Downgrade
    return (
      <button
        onClick={() => handleSelectTier(tier)}
        disabled={isProcessing || processing}
        className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all bg-gray-500 hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <TrendingDown className="w-5 h-5" />
            Downgrade
          </>
        )}
      </button>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-6">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentSubscription?.subscription ? "Manage Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {currentSubscription?.subscription 
              ? `You're currently on the ${currentTierName} plan. Upgrade for more features or downgrade anytime.`
              : "Start free or unlock more features. All paid plans include a free trial!"
            }
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentSubscription?.subscription && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TIER_COLORS[currentTierName]?.iconBg || "bg-gray-200"}`}>
                  {(() => {
                    const Icon = TIER_ICONS[currentTierName] || Star;
                    return <Icon className={`w-5 h-5 ${TIER_COLORS[currentTierName]?.text || "text-gray-700"}`} />;
                  })()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Current Plan: {currentTierName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentSubscription.subscription?.billingCycle?.toLowerCase() || "Free"} billing
                    {currentSubscription.subscription?.endDate && (
                      <> · Renews {new Date(currentSubscription.subscription.endDate).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              {currentSubscription.subscription?.status === "TRIAL" && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Trial Active
                </span>
              )}
            </div>
          </div>
        )}

        {/* Billing Cycle Toggle - UPDATED (Removed WEEKLY) */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            {["MONTHLY", "YEARLY"].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setSelectedBillingCycle(cycle)}
                className={`px-8 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBillingCycle === cycle
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                {cycle === "YEARLY" && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Save ~16%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Currency:</span>
            <button
              onClick={() => setCurrency("NPR")}
              className={`px-3 py-1 rounded ${currency === "NPR" ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"}`}
            >
              🇳🇵 NPR
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded ${currency === "USD" ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"}`}
            >
              🌍 USD
            </button>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier) => {
            const colors = TIER_COLORS[tier.name] || TIER_COLORS.FREE;
            const Icon = TIER_ICONS[tier.name] || Star;
            const pricing = tier.pricing[selectedBillingCycle];
            const isPopular = colors.popular;
            const isProcessing = processing === tier.id;
            const relation = getTierRelation(tier.name);
            const isCurrent = relation === "current";

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-xl flex flex-col ${
                  isPopular ? "ring-2 ring-purple-500 ring-offset-2 scale-105" : ""
                } ${isCurrent ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
              >
                {/* Popular Badge */}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-purple-600 text-white text-sm font-bold rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-green-600 text-white text-sm font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{tier.displayName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  {pricing?.finalPrice === 0 ? (
                    <div className="text-4xl font-bold text-gray-900">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg text-gray-500">{currency === "NPR" ? "Rs." : "$"}</span>
                        <span className="text-4xl font-bold text-gray-900">
                          {pricing?.finalPrice?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        /{selectedBillingCycle.toLowerCase().replace("ly", "")}
                      </p>
                      {pricing?.discountPercent > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          <s className="text-gray-400">{currency === "NPR" ? "Rs." : "$"}{pricing?.price?.toLocaleString()}</s>
                          {" "}Save {pricing.discountPercent}%
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Trial Badge */}
                {tier.trialDays > 0 && !currentSubscription?.subscription && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {tier.trialDays}-day free trial
                    </span>
                  </div>
                )}

                {/* Upgrade/Downgrade Indicator */}
                {currentSubscription?.subscription && !isCurrent && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {relation === "upgrade" ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Upgrade</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Downgrade</span>
                      </>
                    )}
                  </div>
                )}

                {/* Key Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>{tier.features.maxListings}</strong> listings</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>{tier.features.commissionPercent}%</strong> commission</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>{tier.features.maxPhotosPerListing}</strong> photos/listing</span>
                  </li>
                  {tier.features.featuredListingSlots > 0 && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><strong>{tier.features.featuredListingSlots}</strong> featured slots</span>
                    </li>
                  )}
                  {tier.features.verifiedBadge && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Verified badge</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Calendar sync</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant booking</span>
                  </li>
                </ul>

                {/* CTA Button */}
                {renderActionButton(tier, colors, isProcessing)}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Compare Features</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Feature</th>
                  {tiers.map((tier) => {
                    const isCurrent = getTierRelation(tier.name) === "current";
                    return (
                      <th 
                        key={tier.id} 
                        className={`text-center px-6 py-4 text-sm font-semibold ${
                          isCurrent ? "text-green-700 bg-green-50" : "text-gray-900"
                        }`}
                      >
                        {tier.displayName}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-normal text-green-600">(Current)</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {FEATURE_LIST.map((feature) => (
                  <tr key={feature.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{feature.label}</td>
                    {tiers.map((tier) => {
                      const isCurrent = getTierRelation(tier.name) === "current";
                      return (
                        <td 
                          key={tier.id} 
                          className={`px-6 py-4 text-center text-sm font-medium ${
                            isCurrent ? "bg-green-50" : ""
                          }`}
                        >
                          {formatValue(feature, tier.features[feature.key])}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How does upgrading work?</h3>
              <p className="text-gray-600 text-sm">When you upgrade, you only pay the prorated difference for the remaining days in your billing period. Your new features are available immediately.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What happens when I downgrade?</h3>
              <p className="text-gray-600 text-sm">Your plan changes immediately. If you have more listings than your new plan allows, you'll have 7 days to choose which ones to keep active. The rest will be archived (not deleted).</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I restore archived listings?</h3>
              <p className="text-gray-600 text-sm">Yes! Archived listings are never deleted. You can restore them anytime by upgrading to a plan with more listing slots.</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">In Nepal, we accept eSewa and Khalti. For international payments, we use Dodo Payments which supports major credit/debit cards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}