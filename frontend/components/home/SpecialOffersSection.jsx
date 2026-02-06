// components/home/SpecialOffersSection.jsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Gift, TrendingUp, Sparkles, Clock, Tag } from "lucide-react";
import ListingCard from "./ListingCard";
import {
  hasTieredDiscounts,
  hasBonusHoursOffer,
  hasAnySpecialOffer,
  OFFER_FILTER_TYPES,
} from "../../hooks/useListingFilters";

const TABS = [
  {
    id: OFFER_FILTER_TYPES.ALL,
    label: "All Offers",
    icon: Sparkles,
    color: "purple",
    description: "All special deals",
  },
  {
    id: OFFER_FILTER_TYPES.TIERED,
    label: "Tiered Deals",
    icon: TrendingUp,
    color: "indigo",
    description: "Book longer, save more",
  },
  {
    id: OFFER_FILTER_TYPES.BONUS,
    label: "Bonus Hours",
    icon: Gift,
    color: "emerald",
    description: "Get free extra time",
  },
];

export default function SpecialOffersSection({
  listings = [],
  loading = false,
  maxItems = 6,
}) {
  const [activeTab, setActiveTab] = useState(OFFER_FILTER_TYPES.ALL);

  // Filter listings based on active tab
  const filteredListings = useMemo(() => {
    if (!listings || listings.length === 0) return [];

    switch (activeTab) {
      case OFFER_FILTER_TYPES.TIERED:
        return listings.filter(hasTieredDiscounts);
      case OFFER_FILTER_TYPES.BONUS:
        return listings.filter(hasBonusHoursOffer);
      case OFFER_FILTER_TYPES.ALL:
      default:
        return listings.filter(hasAnySpecialOffer);
    }
  }, [listings, activeTab]);

  // Get counts for each tab
  const counts = useMemo(() => {
    if (!listings || listings.length === 0) {
      return { all: 0, tiered: 0, bonus: 0 };
    }
    return {
      all: listings.filter(hasAnySpecialOffer).length,
      tiered: listings.filter(hasTieredDiscounts).length,
      bonus: listings.filter(hasBonusHoursOffer).length,
    };
  }, [listings]);

  // Display listings (limited)
  const displayListings = filteredListings.slice(0, maxItems);
  const totalCount = filteredListings.length;

  // Loading state
  if (loading) {
    return (
      <section className="py-10 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-6" />
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-28 bg-stone-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100">
                <div className="aspect-[16/10] bg-stone-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no special offers at all
  if (counts.all === 0) {
    return null;
  }

  // Get active tab config
  const activeTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="py-10 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">
                🎁 Special Offers
              </h2>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {counts.all} deals
              </span>
            </div>
            <p className="text-sm text-stone-600 ml-11">
              Duration discounts & bonus hours to maximize your savings
            </p>
          </div>
          {totalCount > maxItems && (
            <Link
              href={`/listings?offers=${activeTab}`}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm mt-2 sm:mt-0 flex items-center gap-1"
            >
              View all {totalCount}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const count = tab.id === "all" ? counts.all : tab.id === "tiered" ? counts.tiered : counts.bonus;
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            // Skip tabs with 0 count (except "All" which we always show if there are any offers)
            if (count === 0 && tab.id !== "all") return null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200 border-2
                  ${isActive
                    ? tab.id === "tiered"
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25"
                      : tab.id === "bonus"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25"
                      : "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                    : "bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded-full
                    ${isActive
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info Banner based on active tab */}
        <div className="mb-6">
          {activeTab === OFFER_FILTER_TYPES.TIERED && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                4+ hours: 10% off
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                6+ hours: 15% off
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                8+ hours: 20% off
              </span>
            </div>
          )}
          {activeTab === OFFER_FILTER_TYPES.BONUS && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
                <Gift className="w-3.5 h-3.5" />
                Book 4+ hours → Get 1 hour FREE!
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
                <Gift className="w-3.5 h-3.5" />
                Book 6+ hours → Get 2 hours FREE!
              </span>
            </div>
          )}
          {activeTab === OFFER_FILTER_TYPES.ALL && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 shadow-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                Tiered Discounts - Book longer, save more
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
                <Gift className="w-3.5 h-3.5" />
                Bonus Hours - Get free extra time
              </span>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {displayListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/50 rounded-xl">
            <activeTabConfig.icon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600">No {activeTabConfig.label.toLowerCase()} available</p>
          </div>
        )}

        {/* View All CTA */}
        {totalCount > maxItems && (
          <div className="mt-8 text-center">
            <Link
              href={`/listings?offers=${activeTab}`}
              className={`
                inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl 
                hover:shadow-lg transition-all text-sm text-white
                ${activeTab === "tiered"
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                  : activeTab === "bonus"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500"
                }
              `}
            >
              <activeTabConfig.icon className="w-4 h-4" />
              See All {totalCount} {activeTabConfig.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}