// components/home/ListingSection.jsx
"use client";

import Link from "next/link";
import ListingCard from "./ListingCard";
import { Gift, TrendingUp, Sparkles, Clock, Percent, Tag, Flame } from "lucide-react";

const SECTION_CONFIG = {
  featured: {
    title: "⭐ Featured Venues",
    gradient: "from-amber-500 to-orange-500",
    emptyIcon: "⭐",
    bgClass: ""
  },
  discounted: {
    title: "🔥 Hot Deals & Sales",
    subtitle: "Limited time discounts - Don't miss out!",
    gradient: "from-red-500 to-rose-500",
    emptyIcon: "🔥",
    bgClass: "bg-gradient-to-r from-red-50 via-rose-50 to-orange-50",
    icon: Flame,
    iconBg: "from-red-500 to-rose-500",
    accentColor: "red"
  },
  trending: {
    title: "📈 Trending Now",
    gradient: "from-purple-500 to-indigo-500",
    emptyIcon: "📈",
    bgClass: ""
  },
  new: {
    title: "🆕 Just Added",
    gradient: "from-blue-500 to-cyan-500",
    emptyIcon: "🆕",
    bgClass: "bg-gradient-to-r from-blue-50 to-cyan-50"
  },
  tieredDiscounts: {
    title: "📊 Book Longer, Save More",
    subtitle: "Get bigger discounts when you book for more hours",
    gradient: "from-indigo-500 to-violet-500",
    emptyIcon: "📊",
    bgClass: "bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50",
    icon: TrendingUp,
    iconBg: "from-indigo-500 to-violet-500",
    accentColor: "indigo"
  },
  bonusHours: {
    title: "🎁 Free Bonus Hours",
    subtitle: "Book minimum hours and get extra time FREE",
    gradient: "from-emerald-500 to-teal-500",
    emptyIcon: "🎁",
    bgClass: "bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50",
    icon: Gift,
    iconBg: "from-emerald-500 to-teal-500",
    accentColor: "emerald"
  },
  specialOffers: {
    title: "🎁 Special Offers",
    subtitle: "Duration discounts & bonus hours",
    gradient: "from-indigo-500 to-purple-500",
    emptyIcon: "🎁",
    bgClass: "bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50"
  }
};

export default function ListingSection({ 
  type, 
  listings = [], 
  loading = false,
  maxItems = 6,
  showViewAll = true
}) {
  const config = SECTION_CONFIG[type] || SECTION_CONFIG.featured;
  const displayListings = listings.slice(0, maxItems);

  if (loading) {
    return (
      <section className={`py-8 ${config.bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-40 bg-stone-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
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

  if (displayListings.length === 0) {
    return null;
  }

  // Hot Deals / Discounted section
  if (type === "discounted") {
    const IconComponent = config.icon || Flame;
    
    const discountReasons = [...new Set(
      displayListings
        .filter(l => l.discountReason)
        .map(l => l.discountReason)
    )].slice(0, 4);

    return (
      <section className={`py-10 ${config.bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 bg-gradient-to-r ${config.iconBg} rounded-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">{config.title}</h2>
              </div>
              <p className="text-sm text-stone-600 ml-11">{config.subtitle}</p>
            </div>
            {showViewAll && listings.length > maxItems && (
              <Link href="/public/listings?offers=sale" className="text-red-600 hover:text-red-700 font-medium text-sm mt-2 sm:mt-0">
                View all deals →
              </Link>
            )}
          </div>

          {discountReasons.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {discountReasons.map((reason, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-red-700 border border-red-200 shadow-sm">
                  <Tag className="w-3.5 h-3.5" />
                  {reason}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-orange-700 border border-orange-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                Limited Time Only
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length > maxItems && (
            <div className="mt-6 text-center">
              <Link href="/public/listings?offers=sale" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm">
                <Percent className="w-4 h-4" />
                See All {listings.length} Hot Deals
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Tiered Discounts section
  if (type === "tieredDiscounts") {
    const IconComponent = config.icon;
    return (
      <section className={`py-10 ${config.bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 bg-gradient-to-r ${config.iconBg} rounded-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">{config.title}</h2>
              </div>
              <p className="text-sm text-stone-600 ml-11">{config.subtitle}</p>
            </div>
            {showViewAll && listings.length > maxItems && (
              <Link href="/public/listings?offers=tiered" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2 sm:mt-0">
                View all →
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length > maxItems && (
            <div className="mt-6 text-center">
              <Link href="/public/listings?offers=tiered" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm">
                <Percent className="w-4 h-4" />
                See All {listings.length} Tiered Deals
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Bonus Hours section
  if (type === "bonusHours") {
    const IconComponent = config.icon;
    return (
      <section className={`py-10 ${config.bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 bg-gradient-to-r ${config.iconBg} rounded-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">{config.title}</h2>
              </div>
              <p className="text-sm text-stone-600 ml-11">{config.subtitle}</p>
            </div>
            {showViewAll && listings.length > maxItems && (
              <Link href="/public/listings?offers=bonus" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mt-2 sm:mt-0">
                View all →
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
              <Gift className="w-3.5 h-3.5" />
              Book 4+ hours → Get 1 hour FREE!
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
              <Gift className="w-3.5 h-3.5" />
              Book 6+ hours → Get 2 hours FREE!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length > maxItems && (
            <div className="mt-6 text-center">
              <Link href="/public/listings?offers=bonus" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm">
                <Gift className="w-4 h-4" />
                See All {listings.length} Bonus Offers
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Special Offers section (combined)
  if (type === "specialOffers") {
    return (
      <section className={`py-10 ${config.bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">{config.title}</h2>
              </div>
              <p className="text-sm text-stone-600 ml-11">{config.subtitle}</p>
            </div>
            {showViewAll && listings.length > maxItems && (
              <Link href="/public/listings?offers=all" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2 sm:mt-0">
                View all offers →
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              Tiered Discounts - Book longer, save more
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200 shadow-sm">
              <Gift className="w-3.5 h-3.5" />
              Bonus Hours - Get free extra time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length > maxItems && (
            <div className="mt-6 text-center">
              <Link href="/public/listings?offers=all" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm">
                <Gift className="w-4 h-4" />
                See All {listings.length} Special Offers
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Default section rendering
  return (
    <section className={`py-8 ${config.bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-stone-900">{config.title}</h2>
          {showViewAll && listings.length > maxItems && (
            <Link href={`/public/listings?section=${type}`} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
              View all →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}