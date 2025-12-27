"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../utils/api.js";

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [amenities, setAmenities] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    sortBy: searchParams.get("sortBy") || "newest",
    page: parseInt(searchParams.get("page")) || 1,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch amenities for filter options
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

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings();
  }, [filters.page, filters.sortBy]);

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

  // Apply filters
  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchListings();
    updateURL();
    setShowFilters(false);
  };

  // Update URL with filters
  const updateURL = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.location) params.set("location", filters.location);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","));
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
      sortBy: "newest",
      page: 1,
    });
    router.push("/listings");
    fetchListings();
  };

  // Toggle amenity filter
  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];

  const hasActiveFilters = filters.search || filters.location || filters.minPrice || filters.maxPrice || filters.amenities.length > 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                    {(filters.search ? 1 : 0) + (filters.location ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) + filters.amenities.length}
                  </span>
                )}
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-stone-50 rounded-xl border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Kathmandu"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Min Price (Rs.)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Max Price (Rs.)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
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
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium"
                >
                  Clear all
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {filters.search ? `Results for "${filters.search}"` : "All Venues"}
            </h1>
            {pagination && (
              <p className="text-stone-500 text-sm mt-1">
                Showing {listings.length} of {pagination.total} venues
              </p>
            )}
          </div>
          <Link
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            <p className="text-stone-500 mt-3">Loading venues...</p>
          </div>
        ) : listings.length > 0 ? (
          <>
            {/* Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-200 hover:border-emerald-300"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={listing.images?.[0]?.url || "/placeholder.jpg"}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <div className="font-bold text-emerald-600 text-sm">
                        Rs.{listing.hourlyRate || "N/A"}/hr
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-900 mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {listing.title}
                    </h3>

                    <div className="flex items-center text-sm text-stone-500 mb-2">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>

                    {/* Amenities */}
                    {listing.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 2).map((amenity, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                        {listing.amenities.length > 2 && (
                          <span className="px-2 py-0.5 text-stone-400 text-xs">
                            +{listing.amenities.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          filters.page === pageNum
                            ? "bg-emerald-500 text-white"
                            : "hover:bg-stone-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 text-stone-300">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No venues found</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              We couldn't find any venues matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <p className="text-stone-500 mt-3">Loading...</p>
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}