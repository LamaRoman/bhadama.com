// app/listings/page.jsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../utils/api";
import {
  Search, Filter, X, ChevronLeft, ChevronRight, Loader2,
  Gift, TrendingUp, Sparkles, Tag, MapPin, Users, Star,
} from "lucide-react";
import {
  hasTieredDiscounts,
  hasBonusHoursOffer,
  hasAnySpecialOffer,
  hasOnSaleDiscount,
  getDurationTiers,
  getBonusOffer,
  OFFER_FILTER_TYPES,
} from "../../../hooks/useListingFilters";

// Offer filter options
const OFFER_FILTER_OPTIONS = [
  { id: OFFER_FILTER_TYPES.ALL, label: "All Special Offers", icon: Sparkles, color: "purple" },
  { id: OFFER_FILTER_TYPES.TIERED, label: "Tiered Deals", icon: TrendingUp, color: "indigo" },
  { id: OFFER_FILTER_TYPES.BONUS, label: "Bonus Hours", icon: Gift, color: "emerald" },
  { id: OFFER_FILTER_TYPES.ON_SALE, label: "On Sale", icon: Tag, color: "red" },
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    offers: searchParams.get("offers") || "",
    sortBy: searchParams.get("sortBy") || "newest",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Fetch amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const data = await api("/api/publicListings/amenities");
        setAmenities(data.amenities || []);
      } catch (err) {
        console.error("Failed to fetch amenities:", err);
      }
    };
    fetchAmenities();
  }, []);

  // Fetch listings
  useEffect(() => {
    fetchListings();
  }, [filters.page, filters.sortBy]);

  // Update filters from URL on mount
  useEffect(() => {
    const offersParam = searchParams.get("offers");
    if (offersParam && offersParam !== filters.offers) {
      setFilters((prev) => ({ ...prev, offers: offersParam }));
    }
  }, [searchParams]);

  const fetchListings = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.location) params.append("location", filters.location);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.amenities.length > 0) params.append("amenities", filters.amenities.join(","));
      params.append("sortBy", filters.sortBy);
      params.append("page", filters.page.toString());
      params.append("limit", "12");

      const data = await api(`/api/publicListings?${params.toString()}`);

      if (data.listings) {
        setListings(data.listings);
        setPagination(data.pagination);
      } else {
        setListings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side offer filtering
  const filteredListings = useMemo(() => {
    if (!filters.offers) return listings;

    return listings.filter((listing) => {
      switch (filters.offers) {
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
  }, [listings, filters.offers]);

  // Get offer counts
  const offerCounts = useMemo(() => {
    return {
      all: listings.filter(hasAnySpecialOffer).length,
      tiered: listings.filter(hasTieredDiscounts).length,
      bonus: listings.filter(hasBonusHoursOffer).length,
      sale: listings.filter(hasOnSaleDiscount).length,
    };
  }, [listings]);

  // Apply filters
  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchListings();
    updateURL();
    setShowFilters(false);
  };

  // Update URL
  const updateURL = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.location) params.set("location", filters.location);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","));
    if (filters.offers) params.set("offers", filters.offers);
    if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);

    router.push(`/listings?${params.toString()}`, { scroll: false });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      amenities: [],
      offers: "",
      sortBy: "newest",
      page: 1,
    });
    router.push("/listings");
    setTimeout(() => fetchListings(), 100);
  };

  // Toggle amenity
  const toggleAmenity = (amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // Toggle offer filter
  const toggleOfferFilter = (offerId) => {
    const newOffers = filters.offers === offerId ? "" : offerId;
    setFilters((prev) => ({ ...prev, offers: newOffers }));
    
    // Update URL immediately
    const params = new URLSearchParams(window.location.search);
    if (newOffers) {
      params.set("offers", newOffers);
    } else {
      params.delete("offers");
    }
    router.push(`/listings?${params.toString()}`, { scroll: false });
  };

  // Pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];

  const hasActiveFilters =
    filters.search || filters.location || filters.minPrice || filters.maxPrice || 
    filters.amenities.length > 0 || filters.offers;

  const activeFilterCount =
    (filters.search ? 1 : 0) + (filters.location ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    filters.amenities.length + (filters.offers ? 1 : 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleApplyFilters()}
                  placeholder="Search venues, locations, amenities..."
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  hasActiveFilters
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-stone-300 hover:bg-stone-50"
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Offer Filter Pills */}
          {(offerCounts.all > 0 || offerCounts.sale > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-stone-500 py-1">Quick filters:</span>
              {OFFER_FILTER_OPTIONS.map((option) => {
                const count = option.id === "all" ? offerCounts.all
                  : option.id === "tiered" ? offerCounts.tiered
                  : option.id === "bonus" ? offerCounts.bonus
                  : offerCounts.sale;

                if (count === 0) return null;

                const isActive = filters.offers === option.id;
                const IconComponent = option.icon;

                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOfferFilter(option.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      isActive
                        ? option.id === "tiered" ? "bg-indigo-500 text-white border-indigo-500"
                        : option.id === "bonus" ? "bg-emerald-500 text-white border-emerald-500"
                        : option.id === "sale" ? "bg-red-500 text-white border-red-500"
                        : "bg-purple-500 text-white border-purple-500"
                        : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {option.label}
                    <span className={`text-xs ${isActive ? "opacity-75" : "text-stone-500"}`}>({count})</span>
                    {isActive && <X className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-stone-50 rounded-xl border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Kathmandu"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Min Price (Rs.)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Max Price (Rs.)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Special Offers Filter in Panel */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Special Offers</label>
                <div className="flex flex-wrap gap-2">
                  {OFFER_FILTER_OPTIONS.map((option) => {
                    const count = option.id === "all" ? offerCounts.all
                      : option.id === "tiered" ? offerCounts.tiered
                      : option.id === "bonus" ? offerCounts.bonus
                      : offerCounts.sale;

                    if (count === 0) return null;

                    const isActive = filters.offers === option.id;
                    const IconComponent = option.icon;

                    return (
                      <button
                        key={option.id}
                        onClick={() => setFilters((prev) => ({ ...prev, offers: prev.offers === option.id ? "" : option.id }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          isActive
                            ? option.id === "tiered" ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                            : option.id === "bonus" ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : option.id === "sale" ? "bg-red-50 text-red-700 border-red-300"
                            : "bg-purple-50 text-purple-700 border-purple-300"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {option.label}
                        <span className="text-xs opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.slice(0, 15).map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          filters.amenities.includes(amenity)
                            ? "bg-emerald-500 text-white"
                            : "bg-white border border-stone-300 hover:border-emerald-500"
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Actions */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
                <button onClick={handleClearFilters} className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium">
                  Clear all
                </button>
                <button onClick={handleApplyFilters} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {filters.search ? `Results for "${filters.search}"`
                : filters.offers ? OFFER_FILTER_OPTIONS.find((o) => o.id === filters.offers)?.label || "Venues"
                : "All Venues"}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Showing {filteredListings.length} of {pagination?.total || listings.length} venues
              {filters.offers && ` with ${filters.offers === "all" ? "special offers" : filters.offers === "tiered" ? "tiered deals" : filters.offers === "bonus" ? "bonus hours" : "discounts"}`}
            </p>
          </div>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-600" />
            <p className="text-stone-500 mt-3">Loading venues...</p>
          </div>
        ) : filteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <ListingCardBrowse key={listing.id} listing={listing} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-50 hover:bg-stone-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-stone-600">Page {filters.page} of {pagination.pages}</span>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-50 hover:bg-stone-50 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-20 h-20 mx-auto mb-4 text-stone-300" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No venues found</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              We couldn't find any venues matching your criteria.
            </p>
            <button onClick={handleClearFilters} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCardBrowse({ listing }) {
  const durationTiers = getDurationTiers(listing);
  const bonusOffer = getBonusOffer(listing);
  const hasTiered = durationTiers.length > 0;
  const hasBonus = !!bonusOffer;
  const hasDiscount = listing.discountPercent > 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-stone-200 hover:border-emerald-300"
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={listing.images?.[0]?.url || "/placeholder.jpg"}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasTiered && (
            <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Tiered
            </span>
          )}
          {hasBonus && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <Gift className="w-2.5 h-2.5" /> Bonus
            </span>
          )}
        </div>
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {listing.discountPercent}% OFF
            </span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          <div className="font-bold text-emerald-600 text-sm">Rs.{listing.hourlyRate || "N/A"}/hr</div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 mb-1 line-clamp-1 group-hover:text-emerald-700">{listing.title}</h3>
        <div className="flex items-center text-sm text-stone-500 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        {hasTiered && (
          <div className="flex flex-wrap gap-1 mb-2">
            {durationTiers.slice(0, 2).map((tier, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded">
                {tier.minHours}h+: {tier.discountPercent}% off
              </span>
            ))}
          </div>
        )}
        {hasBonus && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-2 w-fit">
            <Gift className="w-3 h-3" />
            {bonusOffer.label || `${bonusOffer.minHours}+ hrs = ${bonusOffer.bonusHours}hr FREE`}
          </div>
        )}
        {!hasTiered && !hasBonus && listing.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.amenities.slice(0, 2).map((a, i) => (
              <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">{a}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}