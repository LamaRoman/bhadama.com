"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "./utils/api.js";
import { HeroSection, ListingSection, ListingCard } from "../components/home";
import Link from "next/link";

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState([]);
  const [sections, setSections] = useState({
    featured: [],
    discounted: [],
    trending: [],
    new: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch homepage sections
      const homepageData = await api("/api/discover/homepage");
      setSections({
        featured: homepageData.featured || [],
        discounted: homepageData.discounted || [],
        trending: homepageData.trending || [],
        new: homepageData.new || []
      });

      // Fetch all listings for search
      const listingsData = await api("/api/publicListings");
      setAllListings(Array.isArray(listingsData) ? listingsData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on search query
  const filteredListings = searchQuery
    ? allListings.filter((listing) =>
        listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.amenities?.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  // Format listing for ListingCard component
  const formatListing = (listing) => ({
    id: listing.id,
    title: listing.title,
    location: listing.location,
    originalPrice: Number(listing.hourlyRate || 0),
    discountedPrice: Number(listing.hourlyRate || 0),
    discountPercent: listing.discountPercent || 0,
    hasDiscount: (listing.discountPercent || 0) > 0,
    isFeatured: listing.isFeatured || false,
    isNew: listing.isNew || false,
    coverImage: listing.images?.[0]?.url || null,
    host: listing.host,
    reviewCount: listing._count?.reviews || 0,
    capacity: listing.capacity,
    amenities: listing.amenities || []
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Search Results */}
      {searchQuery && (
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-900">
                Search results for "{searchQuery}" ({filteredListings.length})
              </h2>
              <Link
                href="/"
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                Clear search
              </Link>
            </div>

            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={formatListing(listing)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-stone-600">No venues found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Show sections only when not searching */}
      {!searchQuery && (
        <>
          {/* Featured Listings */}
          <ListingSection 
            type="featured" 
            listings={sections.featured} 
            loading={loading} 
          />

          {/* Hot Deals / Discounted */}
          {sections.discounted.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50">
              <ListingSection 
                type="discounted" 
                listings={sections.discounted} 
                loading={loading} 
              />
            </div>
          )}

          {/* Trending */}
          <ListingSection 
            type="trending" 
            listings={sections.trending} 
            loading={loading} 
          />

          {/* New Listings */}
          {sections.new.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <ListingSection 
                type="new" 
                listings={sections.new} 
                loading={loading} 
              />
            </div>
          )}
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Host Your Event?
          </h2>
          <p className="text-white/80 mb-6">
            List your space and start earning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/host/listings/new" className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-lg">
              Become a Host
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}