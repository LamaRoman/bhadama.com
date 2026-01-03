// components/home/HeroSection.jsx
"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../app/utils/api.js";
import { Gift, TrendingUp, Sparkles, Tag, X, Search, Loader2 } from "lucide-react";
import {
  hasTieredDiscounts,
  hasBonusHoursOffer,
  hasAnySpecialOffer,
  hasOnSaleDiscount,
  OFFER_FILTER_TYPES,
} from "../../hooks/useListingFilters";

// Filter pill configuration
const FILTER_OPTIONS = [
  { id: "none", label: "All Results", icon: null },
  { id: OFFER_FILTER_TYPES.ALL, label: "Special Offers", icon: Sparkles, color: "purple" },
  { id: OFFER_FILTER_TYPES.TIERED, label: "Tiered Deals", icon: TrendingUp, color: "indigo" },
  { id: OFFER_FILTER_TYPES.BONUS, label: "Bonus Hours", icon: Gift, color: "emerald" },
  { id: OFFER_FILTER_TYPES.ON_SALE, label: "On Sale", icon: Tag, color: "red" },
];

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewListings, setPreviewListings] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [offerFilter, setOfferFilter] = useState("none");

  // Debounce helper
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Server-side search
  const performSearch = async (query) => {
    if (!query.trim()) {
      setPreviewListings([]);
      setTotalResults(0);
      setHasSearched(false);
      setOfferFilter("none");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const data = await api(
        `/api/publicListings/search?q=${encodeURIComponent(query.trim())}&limit=12`
      );

      if (data.listings) {
        setPreviewListings(data.listings);
        setTotalResults(data.pagination?.total || data.listings.length);
      } else {
        setPreviewListings(Array.isArray(data) ? data : []);
        setTotalResults(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setPreviewListings([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => performSearch(query), 300),
    []
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else if (value.trim().length === 0) {
      setPreviewListings([]);
      setTotalResults(0);
      setHasSearched(false);
      setOfferFilter("none");
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setTimeout(() => {
        document.getElementById("search-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle popular search click
  const handlePopularSearch = (term) => {
    setSearchQuery(term);
    performSearch(term);
    setTimeout(() => {
      document.getElementById("search-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setPreviewListings([]);
    setTotalResults(0);
    setHasSearched(false);
    setOfferFilter("none");
  };

  // Navigate to full listings page
  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.set("search", searchQuery.trim());
    if (offerFilter !== "none") {
      params.set("offers", offerFilter);
    }
    router.push(`/listings?${params.toString()}`);
  };

  // Filter listings based on offer filter
  const filteredListings = useMemo(() => {
    if (offerFilter === "none") return previewListings;

    return previewListings.filter((listing) => {
      switch (offerFilter) {
        case OFFER_FILTER_TYPES.TIERED:
          return hasTieredDiscounts(listing);
        case OFFER_FILTER_TYPES.BONUS:
          return hasBonusHoursOffer(listing);
        case OFFER_FILTER_TYPES.ON_SALE:
          return hasOnSaleDiscount(listing);
        case OFFER_FILTER_TYPES.ALL:
          return hasAnySpecialOffer(listing);
        default:
          return true;
      }
    });
  }, [previewListings, offerFilter]);

  // Get counts for filter pills
  const filterCounts = useMemo(() => {
    return {
      all: previewListings.filter(hasAnySpecialOffer).length,
      tiered: previewListings.filter(hasTieredDiscounts).length,
      bonus: previewListings.filter(hasBonusHoursOffer).length,
      sale: previewListings.filter(hasOnSaleDiscount).length,
    };
  }, [previewListings]);

  // Display max 6 listings
  const displayListings = filteredListings.slice(0, 6);

  const popularSearches = ["Pool", "Garden", "Party Venue", "Conference Room", "Wedding Hall"];

  return (
    <div className="relative">
      {/* Hero Background Section */}
      <section className="relative min-h-[300px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-10 left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Find the Perfect Venue <br />
            <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              for Your Event
            </span>
          </h1>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-5">
            <div className="relative flex items-center bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="flex-1 flex items-center">
                <Search className="w-5 h-5 text-stone-400 ml-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Search venues, locations, amenities..."
                  className="flex-1 px-3 py-3.5 text-base text-stone-800 placeholder-stone-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="mr-2 text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="m-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="text-white/60 text-sm">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results Preview Section */}
      {hasSearched && (
        <section id="search-results" className="max-w-7xl mx-auto px-4 py-10">
          {loading && previewListings.length === 0 ? (
            <div className="text-center text-stone-500 py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="mt-2">Searching for "{searchQuery}"...</p>
            </div>
          ) : previewListings.length > 0 ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Search Results</h2>
                  <p className="text-stone-500 text-sm mt-1">
                    {offerFilter !== "none"
                      ? `Showing ${filteredListings.length} of ${totalResults} venues with ${
                          offerFilter === "all"
                            ? "special offers"
                            : offerFilter === "tiered"
                            ? "tiered deals"
                            : offerFilter === "bonus"
                            ? "bonus hours"
                            : "discounts"
                        }`
                      : `Found ${totalResults} venue${totalResults !== 1 ? "s" : ""} for "${searchQuery}"`}
                  </p>
                </div>
                {totalResults > 6 && (
                  <button
                    onClick={handleViewAll}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    View all {totalResults} results
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              {(filterCounts.all > 0 || filterCounts.sale > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {FILTER_OPTIONS.map((option) => {
                    // Get count for this filter
                    let count = 0;
                    if (option.id === "none") count = previewListings.length;
                    else if (option.id === "all") count = filterCounts.all;
                    else if (option.id === "tiered") count = filterCounts.tiered;
                    else if (option.id === "bonus") count = filterCounts.bonus;
                    else if (option.id === "sale") count = filterCounts.sale;

                    // Skip if no results for this filter (except "All Results")
                    if (count === 0 && option.id !== "none") return null;

                    const isActive = offerFilter === option.id;
                    const IconComponent = option.icon;

                    return (
                      <button
                        key={option.id}
                        onClick={() => setOfferFilter(option.id)}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-sm
                          transition-all duration-200 border
                          ${
                            isActive
                              ? option.id === "none"
                                ? "bg-stone-800 text-white border-stone-800"
                                : option.id === "tiered"
                                ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                                : option.id === "bonus"
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                                : option.id === "sale"
                                ? "bg-red-500 text-white border-red-500 shadow-md"
                                : "bg-purple-500 text-white border-purple-500 shadow-md"
                              : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
                          }
                        `}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {option.label}
                        {option.id !== "none" && (
                          <span
                            className={`
                              px-1.5 py-0.5 text-xs rounded-full
                              ${isActive ? "bg-white/20" : "bg-stone-100"}
                            `}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Preview Grid */}
              {displayListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayListings.map((listing) => (
                    <SearchResultCard key={listing.id} listing={listing} searchQuery={searchQuery} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-xl">
                  <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600">No venues with this offer type found</p>
                  <button
                    onClick={() => setOfferFilter("none")}
                    className="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    Show all results
                  </button>
                </div>
              )}

              {/* View All Button */}
              {filteredListings.length > 6 && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleViewAll}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    View all {filteredListings.length} results →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* No Results */
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Search className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                <h3 className="text-lg font-semibold text-stone-700 mb-2">No venues found</h3>
                <p className="text-stone-500 mb-6">
                  We couldn't find any venues matching "{searchQuery}". Try different keywords or
                  browse popular searches.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Search Result Card Component
function SearchResultCard({ listing, searchQuery }) {
  // Get offer details
  const durationTiers = listing.durationDiscounts?.tiers || 
    (Array.isArray(listing.durationDiscounts) ? listing.durationDiscounts : []);
  const bonusOffer = listing.bonusHoursOffer?.minHours ? listing.bonusHoursOffer : null;
  const hasTiered = durationTiers.length > 0;
  const hasBonus = !!bonusOffer;
  const hasDiscount = listing.discountPercent > 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-stone-200 hover:border-emerald-300"
    >
      {/* Image */}
      <div className="h-48 overflow-hidden relative">
        <img
          src={listing.images?.[0]?.url || "/placeholder.jpg"}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasTiered && (
            <span className="px-2 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              Tiered
            </span>
          )}
          {hasBonus && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <Gift className="w-2.5 h-2.5" />
              Bonus
            </span>
          )}
        </div>
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {listing.discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="font-bold text-emerald-600 text-sm">
            Rs.{listing.hourlyRate || listing.price || "N/A"}/hr
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-stone-900 mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {listing.title}
        </h3>

        <div className="flex items-center text-sm text-stone-500 mb-3">
          <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="line-clamp-1">{listing.location}</span>
        </div>

        {/* Offer Details */}
        {hasTiered && (
          <div className="flex flex-wrap gap-1 mb-2">
            {durationTiers.slice(0, 2).map((tier, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                {tier.minHours}h+: {tier.discountPercent}% off
              </span>
            ))}
          </div>
        )}
        
        {hasBonus && (
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100 mb-2 w-fit">
            <Gift className="w-3 h-3" />
            {bonusOffer.label || `Book ${bonusOffer.minHours}+ hrs, get ${bonusOffer.bonusHours}hr FREE`}
          </div>
        )}

        {/* Amenities */}
        {!hasTiered && !hasBonus && listing.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.amenities.slice(0, 3).map((amenity, i) => {
              const isMatch = amenity.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    isMatch
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  {amenity}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {listing._count?.reviews > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {listing._count.reviews}
              </span>
            )}
          </div>
          <span className="text-sm text-emerald-600 font-medium group-hover:translate-x-1 transition-transform">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}