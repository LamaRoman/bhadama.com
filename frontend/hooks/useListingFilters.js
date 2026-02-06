// hooks/useListingFilters.js
"use client";

import { useState, useMemo, useCallback } from "react";

/**
 * Shared hook for filtering listings by offers, price, search, etc.
 * Used across Homepage, HeroSection search, and Browse/Listings page
 */

// Helper: Check if listing has tiered discounts
export const hasTieredDiscounts = (listing) => {
  if (!listing) return false;
  const discounts = listing.durationDiscounts;
  return (
    (discounts?.tiers && discounts.tiers.length > 0) ||
    (Array.isArray(discounts) && discounts.length > 0)
  );
};

// Helper: Check if listing has bonus hours offer
export const hasBonusHoursOffer = (listing) => {
  if (!listing) return false;
  return listing.bonusHoursOffer && listing.bonusHoursOffer.minHours;
};

// Helper: Check if listing has any special offer
export const hasAnySpecialOffer = (listing) => {
  return hasTieredDiscounts(listing) || hasBonusHoursOffer(listing);
};

// Helper: Check if discount is currently active (within date range)
export const isDiscountActive = (listing) => {
  if (!listing) return false;
  if (!listing.discountPercent || listing.discountPercent <= 0) {
    if (!listing.hasDiscount) return false;
  }
  
  const now = new Date();
  
  // Check if discount has started
  if (listing.discountFrom) {
    const fromDate = new Date(listing.discountFrom);
    if (now < fromDate) return false;
  }
  
  // Check if discount has expired
  if (listing.discountUntil) {
    const untilDate = new Date(listing.discountUntil);
    if (now > untilDate) return false;
  }
  
  return true;
};

// Helper: Check if listing has flat discount (on sale) - with date validation
export const hasOnSaleDiscount = (listing) => {
  if (!listing) return false;
  
  const hasDiscountValue = listing.discountPercent > 0 || listing.hasDiscount;
  if (!hasDiscountValue) return false;
  
  return isDiscountActive(listing);
};

// Helper: Get days remaining for discount
export const getDiscountDaysRemaining = (listing) => {
  if (!listing?.discountUntil) return null;
  
  const now = new Date();
  const untilDate = new Date(listing.discountUntil);
  const diffTime = untilDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : null;
};

// Helper: Get duration tiers from listing
export const getDurationTiers = (listing) => {
  if (!listing?.durationDiscounts) return [];
  if (listing.durationDiscounts.tiers && Array.isArray(listing.durationDiscounts.tiers)) {
    return listing.durationDiscounts.tiers;
  }
  if (Array.isArray(listing.durationDiscounts)) {
    return listing.durationDiscounts;
  }
  return [];
};

// Helper: Get bonus offer details
export const getBonusOffer = (listing) => {
  if (!listing?.bonusHoursOffer?.minHours) return null;
  return listing.bonusHoursOffer;
};

// Filter types enum
export const OFFER_FILTER_TYPES = {
  ALL: "all",
  TIERED: "tiered",
  BONUS: "bonus",
  ON_SALE: "sale",
};

/**
 * Main filter hook
 */
export function useListingFilters(initialListings = []) {
  const [offerFilter, setOfferFilter] = useState(OFFER_FILTER_TYPES.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Filter by offer type
  const filterByOfferType = useCallback((listings, filterType) => {
    if (!listings || listings.length === 0) return [];
    
    switch (filterType) {
      case OFFER_FILTER_TYPES.TIERED:
        return listings.filter(hasTieredDiscounts);
      case OFFER_FILTER_TYPES.BONUS:
        return listings.filter(hasBonusHoursOffer);
      case OFFER_FILTER_TYPES.ON_SALE:
        return listings.filter(hasOnSaleDiscount);
      case OFFER_FILTER_TYPES.ALL:
      default:
        return listings.filter(hasAnySpecialOffer);
    }
  }, []);

  // Filter by search query
  const filterBySearch = useCallback((listings, query) => {
    if (!query || !query.trim()) return listings;
    
    const searchLower = query.toLowerCase().trim();
    return listings.filter((listing) => {
      const titleMatch = listing.title?.toLowerCase().includes(searchLower);
      const locationMatch = listing.location?.toLowerCase().includes(searchLower);
      const amenityMatch = listing.amenities?.some((a) =>
        a.toLowerCase().includes(searchLower)
      );
      return titleMatch || locationMatch || amenityMatch;
    });
  }, []);

  // Filter by price range
  const filterByPrice = useCallback((listings, { min, max }) => {
    return listings.filter((listing) => {
      const price = parseFloat(listing.hourlyRate || listing.originalPrice || 0);
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      return true;
    });
  }, []);

  // Filter by amenities
  const filterByAmenities = useCallback((listings, amenities) => {
    if (!amenities || amenities.length === 0) return listings;
    
    return listings.filter((listing) => {
      const listingAmenities = listing.amenities || [];
      return amenities.every((amenity) =>
        listingAmenities.some((a) => 
          a.toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
  }, []);

  // Apply all filters
  const applyAllFilters = useCallback((listings, filters = {}) => {
    let result = [...listings];

    // Apply offer filter if specified
    if (filters.offerType && filters.offerType !== "none") {
      result = filterByOfferType(result, filters.offerType);
    }

    // Apply search filter
    if (filters.search) {
      result = filterBySearch(result, filters.search);
    }

    // Apply price filter
    if (filters.priceRange?.min !== null || filters.priceRange?.max !== null) {
      result = filterByPrice(result, filters.priceRange);
    }

    // Apply amenities filter
    if (filters.amenities?.length > 0) {
      result = filterByAmenities(result, filters.amenities);
    }

    return result;
  }, [filterByOfferType, filterBySearch, filterByPrice, filterByAmenities]);

  // Get counts for each offer type (for showing in tabs)
  const getOfferCounts = useCallback((listings) => {
    if (!listings || listings.length === 0) {
      return { all: 0, tiered: 0, bonus: 0, sale: 0 };
    }

    const allSpecialOffers = listings.filter(hasAnySpecialOffer);
    const tiered = listings.filter(hasTieredDiscounts);
    const bonus = listings.filter(hasBonusHoursOffer);
    const sale = listings.filter(hasOnSaleDiscount);

    return {
      all: allSpecialOffers.length,
      tiered: tiered.length,
      bonus: bonus.length,
      sale: sale.length,
    };
  }, []);

  // Memoized filtered results based on current filter state
  const filteredListings = useMemo(() => {
    return applyAllFilters(initialListings, {
      offerType: offerFilter,
      search: searchQuery,
      priceRange,
      amenities: selectedAmenities,
    });
  }, [initialListings, offerFilter, searchQuery, priceRange, selectedAmenities, applyAllFilters]);

  // Memoized offer counts
  const offerCounts = useMemo(() => {
    return getOfferCounts(initialListings);
  }, [initialListings, getOfferCounts]);

  return {
    // State
    offerFilter,
    searchQuery,
    priceRange,
    selectedAmenities,
    
    // Setters
    setOfferFilter,
    setSearchQuery,
    setPriceRange,
    setSelectedAmenities,
    
    // Computed
    filteredListings,
    offerCounts,
    
    // Utility functions (can be used standalone)
    filterByOfferType,
    filterBySearch,
    filterByPrice,
    filterByAmenities,
    applyAllFilters,
    getOfferCounts,
    
    // Helper functions
    hasTieredDiscounts,
    hasBonusHoursOffer,
    hasAnySpecialOffer,
    hasOnSaleDiscount,
    getDurationTiers,
    getBonusOffer,
  };
}

export default useListingFilters;