"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "../utils/api.js";
import Link from "next/link";

export default function PublicListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track which images failed

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const datePickerRef = useRef(null);
  const guestPickerRef = useRef(null);

  const [searchFilters, setSearchFilters] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* ---------------- CLICK OUTSIDE ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
      if (guestPickerRef.current && !guestPickerRef.current.contains(e.target)) {
        setShowGuestPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- FETCH ---------------- */
  const fetchListings = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const url = params.toString()
        ? `/api/publicListings?${params}`
        : "/api/publicListings";

      const data = await api(url);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setError("Failed to load listings. Please try again.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  /* ---------------- IMAGE ERROR HANDLING ---------------- */
  const handleImageError = (listingId) => {
    setImageErrors(prev => ({ ...prev, [listingId]: true }));
  };

  /* ---------------- CALENDAR ---------------- */
  const daysInMonth = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    return {
      days: new Date(y, m + 1, 0).getDate(),
      start: new Date(y, m, 1).getDay(),
    };
  };

  const selectDate = (day) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
      .toISOString()
      .split("T")[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(d);
    
    if (selectedDate < today) return;

    if (!searchFilters.checkIn || searchFilters.checkOut) {
      setSearchFilters({ ...searchFilters, checkIn: d, checkOut: "" });
    } else if (d > searchFilters.checkIn) {
      setSearchFilters({ ...searchFilters, checkOut: d });
    } else {
      setSearchFilters({ ...searchFilters, checkIn: d, checkOut: "" });
    }
  };

  const isDateInRange = (day) => {
    if (!searchFilters.checkIn || !searchFilters.checkOut) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return d > searchFilters.checkIn && d < searchFilters.checkOut;
  };

  const isDateSelected = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return d === searchFilters.checkIn || d === searchFilters.checkOut;
  };

  const isPastDate = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const formatDateRange = () => {
    if (!searchFilters.checkIn) return "Add dates";
    const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return searchFilters.checkOut
      ? `${formatDate(searchFilters.checkIn)} - ${formatDate(searchFilters.checkOut)}`
      : `${formatDate(searchFilters.checkIn)} - ?`;
  };

  const formatPrice = (price) => {
    const num = Number(price);
    return isNaN(num) ? "$0" : `$${num % 1 === 0 ? num : num.toFixed(2)}`;
  };

  const hasActiveFilters = searchFilters.location || searchFilters.checkIn;

  const clearFilters = () => {
    setSearchFilters({ location: "", checkIn: "", checkOut: "", guests: 2 });
    fetchListings({});
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* HERO */}
      <div className="relative bg-white border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-5 py-5 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              <span className="text-gray-900">Book the space. </span>
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Host the moment.
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover unique places and create unforgettable memories
            </p>
          </div>

          {/* SEARCH - (keeping existing search form code) */}
          <form
            className="relative z-[1000] max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-2 overflow-visible animate-slide-up"
            onSubmit={(e) => {
              e.preventDefault();
              fetchListings(searchFilters);
            }}
          >
            {/* ... (rest of search form - unchanged) ... */}
            <div className="flex flex-col md:flex-row gap-2">
              <input
                className="flex-1 px-4 py-3 text-base border-2 border-transparent rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium"
                placeholder="Where to?"
                value={searchFilters.location}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, location: e.target.value })
                }
              />
              <button 
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RESULTS */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Results Header */}
        {!loading && listings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {listings.length} {listings.length === 1 ? "Property" : "Properties"}
            </h2>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/public/listings/${listing.id}`}
                className="group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up">
                  <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
                    {!imageErrors[listing.id] && listing.images?.[0]?.url ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(listing.id)}
                      />
                    ) : (
                      /* Placeholder Icon */
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {listing.location}
                    </p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(listing.hourlyRate || listing.price)}
                      </span>
                      <span className="text-sm text-gray-500">/hour</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && !error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}