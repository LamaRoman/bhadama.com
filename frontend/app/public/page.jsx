"use client";

import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import Link from "next/link";

export default function PublicListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

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

  const filteredListings = listings.filter(listing => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.location?.toLowerCase().includes(query) ||
      listing.amenities?.some(a => a.toLowerCase().includes(query))
    );
  });

  const formatPrice = (price) => {
    const num = Number(price);
    return isNaN(num) ? "0" : num % 1 === 0 ? num : num.toFixed(2);
  };

  const getImageUrl = (listing) => {
    return listing.images?.[0]?.url || null;
  };

  return (
    <div className="min-h-screen bg-stone-100">
      
      <section className="relative bg-stone-900 text-stone-50 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Title - More Compact */}
            <div className="flex-shrink-0">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                YOUR <span className="text-lime-400">YARD.</span>
                <br />
                THEIR <span className="text-amber-400">PARTY.</span>
              </h1>
            </div>

            {/* Search Bar - Inline */}
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                🔍
              </div>
              <input
                type="text"
                placeholder="Search by location, amenity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-4 text-lg bg-stone-800 border-2 border-stone-700 rounded-xl text-stone-50 placeholder-stone-500 focus:border-lime-400 focus:outline-none transition-all duration-300 shadow-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-2xl"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="mt-4 text-stone-400 text-sm">
              {filteredListings.length} {filteredListings.length === 1 ? 'space' : 'spaces'} found
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-stone-100" style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%, 0 100%)' }} />
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-stone-200 rounded-3xl h-96 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/public/listings/${listing.id}`}
                onMouseEnter={() => setHoveredCard(listing.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="block"
              >
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group" style={{ transform: hoveredCard === listing.id ? 'translateY(-8px)' : 'translateY(0)' }}>
                  
                  <div className="relative h-64 overflow-hidden">
                    {getImageUrl(listing) ? (
                      <img
                        src={getImageUrl(listing)}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                     <div className="flex flex-col items-center justify-center text-gray-400 w-full h-full">
  <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
  <span className="text-sm font-medium">No Image</span>
</div>

                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute top-3 right-3 bg-stone-900/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xl font-black text-lime-400">
                        ${formatPrice(listing.hourlyRate || listing.price)}
                      </span>
                      <span className="text-xs text-stone-300 ml-1">/hr</span>
                    </div>

                    {listing.amenities?.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%] opacity-0 group-hover:opacity-100 transition-all duration-500">
                        {listing.amenities.slice(0, 2).map((amenity, i) => (
                          <span key={i} className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-stone-800">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1 text-stone-500 text-xs mb-2">
                      <span className="text-sm">📍</span>
                      <span className="font-semibold truncate">{listing.location}</span>
                    </div>

                    <h3 className="text-lg font-black text-stone-900 mb-2 leading-tight line-clamp-2 group-hover:text-lime-600 transition-colors duration-300">
                      {listing.title}
                    </h3>

                    {listing.capacity && (
                      <div className="flex items-center gap-1 text-stone-600 mb-3">
                        <span className="text-sm">👥</span>
                        <span className="text-xs font-bold">Up to {listing.capacity} guests</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
                      {listing.minHours && (
                        <div className="text-xs">
                          <span className="text-stone-400">Min </span>
                          <span className="font-bold text-stone-700">{listing.minHours}h</span>
                        </div>
                      )}
                      {listing.amenities?.length > 0 && (
                        <div className="text-xs">
                          <span className="text-stone-400">Features </span>
                          <span className="font-bold text-stone-700">{listing.amenities.length}</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <span className="inline-block px-2 py-1 bg-lime-100 text-lime-800 rounded-full text-xs font-black">
                          AVAILABLE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredListings.length === 0 && (
          <div className="text-center py-24">
            <div className="text-9xl mb-8">🤔</div>
            <h2 className="text-4xl font-black text-stone-900 mb-4">
              No spaces found
            </h2>
            <p className="text-xl text-stone-600 mb-8">
              {searchQuery ? 'Try searching for something else' : 'Looks like we are all booked up!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-lg hover:bg-lime-600 transition-colors duration-300"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      <div className="fixed bottom-8 right-8 z-50">
        <Link
          href="/host/listings/new"
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-stone-900 rounded-full font-black text-lg shadow-2xl hover:shadow-lime-500/50 transform hover:scale-110 transition-all duration-300 group"
        >
          <span className="text-2xl">🏠</span>
          <span>List Your Yard</span>
          <span className="text-2xl">→</span>
        </Link>
      </div>
    </div>
  );
}