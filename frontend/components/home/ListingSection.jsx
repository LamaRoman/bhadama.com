"use client";

import Link from "next/link";
import ListingCard from "./ListingCard";

const SECTION_CONFIG = {
  featured: {
    title: "⭐ Featured Venues",
    gradient: "from-amber-500 to-orange-500",
    emptyIcon: "⭐"
  },
  discounted: {
    title: "🔥 Hot Deals",
    gradient: "from-red-500 to-rose-500",
    emptyIcon: "🔥"
  },
  trending: {
    title: "📈 Trending Now",
    gradient: "from-purple-500 to-indigo-500",
    emptyIcon: "📈"
  },
  new: {
    title: "🆕 Just Added",
    gradient: "from-blue-500 to-cyan-500",
    emptyIcon: "🆕"
  }
};

export default function ListingSection({ 
  type, 
  listings = [], 
  loading = false,
  maxItems = 6 
}) {
  const config = SECTION_CONFIG[type] || SECTION_CONFIG.featured;
  const displayListings = listings.slice(0, maxItems);

  if (loading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-40 bg-stone-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100">
                <div className="aspect-[4/3] bg-stone-200 animate-pulse" />
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

  // Don't render empty sections
  if (displayListings.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Compact */}
        <h2 className="text-xl font-bold text-stone-900 mb-5">
          {config.title}
        </h2>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}