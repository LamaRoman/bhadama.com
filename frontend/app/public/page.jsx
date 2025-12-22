"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../utils/api.js";
import Link from "next/link";

export default function PublicListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewportMode, setViewportMode] = useState("grid"); // grid | map

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await api("/api/publicListings");
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.amenities?.some((a) =>
        a.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Category filter
    const matchesCategory =
      activeFilter === "all" ||
      (activeFilter === "featured" && listing.featured) ||
      (activeFilter === "pool" && listing.amenities?.includes("pool")) ||
      (activeFilter === "outdoor" && listing.category === "outdoor");

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) => {
    const num = Number(price);
    return isNaN(num) ? "0" : num % 1 === 0 ? num : num.toFixed(2);
  };

  const getImageUrl = (listing) => {
    return listing.images?.[0]?.url || null;
  };

  const categories = [
    { id: "all", label: "All Spaces", icon: "🌎" },
    { id: "featured", label: "Featured", icon: "⭐" },
    { id: "pool", label: "Pool", icon: "🏊" },
    { id: "outdoor", label: "Outdoor", icon: "🌳" },
    { id: "luxury", label: "Luxury", icon: "✨" },
  ];

  // Stats for hero section
  const stats = {
    total: listings.length,
    averageRating: 4.8,
    locations: new Set(listings.map((l) => l.location?.split(",")[0])).size,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      {/* Hero Section with Parallax Effect */}
      <section className="relative min-h-[60vh] overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
            {/* Left Column - Headline */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <span className="text-lime-400 text-xl">🌟</span>
                <span className="text-stone-100 text-sm font-medium">
                  {stats.total}+ Premium Spaces Available
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                <span className="block text-white">FIND YOUR</span>
                <span className="block">
                  <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                    PERFECT
                  </span>
                  <span className="text-white"> SPACE</span>
                </span>
              </h1>

              <p className="text-xl text-stone-300 mb-8 max-w-2xl">
                Discover unique outdoor venues for your next celebration. From
                backyard pool parties to garden weddings, find the perfect
                setting.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {stats.total}
                  </div>
                  <div className="text-stone-400 text-sm">Spaces Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {stats.averageRating}
                  </div>
                  <div className="text-stone-400 text-sm">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {stats.locations}
                  </div>
                  <div className="text-stone-400 text-sm">Cities</div>
                </div>
              </div>
            </div>

            {/* Right Column - Search Card */}
            <div className="flex-1 w-full">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-lime-500/20 rounded-xl">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Find Your Perfect Space
                    </h3>
                    <p className="text-stone-300 text-base">
                      Search by location, amenities, or occasion
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-stone-400">
                      📍
                    </div>
                    <input
                      type="text"
                      placeholder="Where would you like to host? Search by city, venue type, or amenities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-12 py-4 bg-white/5 border border-white/25 rounded-xl text-white placeholder-stone-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/30 transition-all text-lg"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xl"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white font-medium">Filter by:</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveFilter(cat.id)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                            activeFilter === cat.id
                              ? "bg-lime-500 text-stone-900 shadow-lg"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-bold">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* View Toggle */}
      <div className="sticky top-4 z-30 max-w-7xl mx-auto px-6 mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600">
            Showing <span className="font-bold">{filteredListings.length}</span>{" "}
            of {listings.length} spaces
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewportMode("grid")}
              className={`p-2 rounded-lg ${
                viewportMode === "grid"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-200"
              }`}
            >
              ⏹️
            </button>
            <button
              onClick={() => setViewportMode("map")}
              className={`p-2 rounded-lg ${
                viewportMode === "map"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-200"
              }`}
            >
              🗺️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : viewportMode === "grid" ? (
          <>
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/public/listings/${listing.id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-stone-200">
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        {getImageUrl(listing) ? (
                          <img
                            src={getImageUrl(listing)}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-stone-100 to-stone-200">
                            <div className="text-center">
                              <span className="text-5xl mb-2 block">🏠</span>
                              <span className="text-stone-500 font-medium">
                                No Image Available
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4">
                          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <div className="flex items-baseline">
                              <span className="text-xl font-black text-stone-900">
                                $
                                {formatPrice(
                                  listing.hourlyRate || listing.price
                                )}
                              </span>
                              <span className="text-xs text-stone-600 ml-1">
                                /hr
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-4 w-full">
                            <button className="w-full py-2 bg-white text-stone-900 font-bold rounded-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-stone-500">📍</span>
                          <span className="text-sm font-medium text-stone-700 truncate">
                            {listing.location}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-stone-900 mb-3 line-clamp-2">
                          {listing.title}
                        </h3>

                        <div className="flex items-center justify-between mb-3">
                          {listing.capacity && (
                            <div className="flex items-center gap-1">
                              <span className="text-stone-500">👥</span>
                              <span className="text-sm font-medium text-stone-700">
                                {listing.capacity} guests
                              </span>
                            </div>
                          )}

                          {listing.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500">⭐</span>
                              <span className="text-sm font-bold text-stone-900">
                                {listing.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Amenities Pill */}
                        {listing.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {listing.amenities.slice(0, 3).map((amenity, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                            {listing.amenities.length > 3 && (
                              <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs font-medium rounded-full">
                                +{listing.amenities.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-block p-8 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl mb-8">
                  <span className="text-6xl">🔍</span>
                </div>
                <h2 className="text-3xl font-bold text-stone-900 mb-4">
                  No spaces match your search
                </h2>
                <p className="text-stone-600 mb-8 max-w-md mx-auto">
                  {searchQuery
                    ? `We couldn't find any spaces matching "${searchQuery}". Try a different location or amenity.`
                    : "All spaces are currently booked. Check back soon!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-8 py-3 bg-stone-900 text-white font-bold rounded-full hover:bg-stone-800 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          // Map View Placeholder
          <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl h-[600px] flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🗺️</span>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">
                Interactive Map View
              </h3>
              <p className="text-stone-600">
                Coming soon - Browse spaces geographically
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
        <Link
          href="/host/listings/new"
          className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-stone-900 rounded-full font-bold shadow-2xl hover:shadow-lime-500/50 transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">
            ✨
          </span>
          <div className="text-left">
            <div className="font-black text-lg">List Your Space</div>
            <div className="text-xs opacity-80">Earn extra income</div>
          </div>
          <span className="text-2xl group-hover:translate-x-2 transition-transform">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
