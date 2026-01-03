// app/page.jsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "./utils/api.js";
import HeroSection from "../components/home/HeroSection";
import ListingSection from "../components/home/ListingSection";
import SpecialOffersSection from "../components/home/SpecialOffersSection";
import ListingCard from "../components/home/ListingCard";
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
    new: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Format listing for ListingCard component
  const formatListing = (listing) => {
    // ✅ FIX: API returns hourlyRate, not originalPrice
    const hourlyRate = Number(listing.hourlyRate || listing.originalPrice || 0);
    const discountPercent = Number(listing.discountPercent || 0);
    
    // Check if discount is currently active
    const now = new Date();
    let discountActive = discountPercent > 0;
    
    if (listing.discountFrom) {
      const fromDate = new Date(listing.discountFrom);
      if (now < fromDate) discountActive = false;
    }
    
    if (listing.discountUntil) {
      const untilDate = new Date(listing.discountUntil);
      if (now > untilDate) discountActive = false;
    }
    
    const effectiveDiscountPercent = discountActive ? discountPercent : 0;
    const discountedPrice = effectiveDiscountPercent > 0 
      ? Math.round(hourlyRate * (1 - effectiveDiscountPercent / 100))
      : hourlyRate;

    return {
      id: listing.id,
      title: listing.title,
      location: listing.location,
      
      // ✅ FIX: Use hourlyRate as the base price
      originalPrice: hourlyRate,
      discountedPrice: discountedPrice,
      discountPercent: effectiveDiscountPercent,
      hasDiscount: effectiveDiscountPercent > 0,
      
      // Discount details
      discountReason: listing.discountReason || null,
      discountFrom: listing.discountFrom || null,
      discountUntil: listing.discountUntil || null,
      
      // Status flags
      isFeatured: listing.isFeatured || false,
      isNew: listing.isNew || false,
      
      // ✅ FIX: Handle different image structures from API
      coverImage: listing.images?.[0]?.url || listing.coverImage || listing.thumbnail || null,
      host: listing.host,
      
      // ✅ FIX: Handle both _count and direct reviewCount
      reviewCount: listing._count?.reviews || listing.reviewCount || 0,
      capacity: listing.capacity,
      amenities: listing.amenities || [],
      
      // Special offer fields - pass through as-is
      durationDiscounts: listing.durationDiscounts || null,
      bonusHoursOffer: listing.bonusHoursOffer || null,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch homepage sections
      const homepageData = await api("/api/discover/homepage");

      // Fetch all listings for special offers section
      const listingsData = await api("/api/publicListings");
      const allListingsArray = Array.isArray(listingsData)
        ? listingsData
        : listingsData.listings || [];

      // Debug: Log first listing to verify structure
      if (allListingsArray.length > 0) {
        console.log("Sample listing from API:", {
          id: allListingsArray[0].id,
          hourlyRate: allListingsArray[0].hourlyRate,
          discountPercent: allListingsArray[0].discountPercent,
          durationDiscounts: allListingsArray[0].durationDiscounts,
          bonusHoursOffer: allListingsArray[0].bonusHoursOffer,
        });
      }

      // Format all listings
      const formattedListings = allListingsArray.map(formatListing);
      setAllListings(formattedListings);

      // Format section listings
      const formatSectionListings = (listings) => {
        if (!listings || !Array.isArray(listings)) return [];
        return listings.map(formatListing);
      };

      setSections({
        featured: formatSectionListings(homepageData.featured),
        discounted: formatSectionListings(homepageData.discounted),
        trending: formatSectionListings(homepageData.trending),
        new: formatSectionListings(homepageData.new),
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on search query (for URL-based search)
  const filteredListings = searchQuery
    ? allListings.filter(
        (listing) =>
          listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.amenities?.some((a) =>
            a.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* URL-based Search Results (fallback if someone navigates with ?search=) */}
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
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-stone-600">
                  No venues found matching "{searchQuery}"
                </p>
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

          {/* 🎁 Special Offers - Tabbed Section (Tiered & Bonus) */}
          <SpecialOffersSection
            listings={allListings}
            loading={loading}
            maxItems={6}
          />

          {/* 🔥 Hot Deals / On Sale (Flat percentage discounts with reasons) */}
          {sections.discounted.length > 0 && (
            <ListingSection
              type="discounted"
              listings={sections.discounted}
              loading={loading}
            />
          )}

          {/* Trending */}
          <ListingSection
            type="trending"
            listings={sections.trending}
            loading={loading}
          />

          {/* New Listings */}
          {sections.new.length > 0 && (
            <ListingSection
              type="new"
              listings={sections.new}
              loading={loading}
            />
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
            <a
              href="/host/listings/new"
              className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-lg"
            >
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}