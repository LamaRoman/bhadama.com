// __tests__/hooks/useListingFilters.test.js
import { renderHook, act } from '@testing-library/react';
import {
  useListingFilters,
  hasTieredDiscounts,
  hasBonusHoursOffer,
  hasAnySpecialOffer,
  hasOnSaleDiscount,
  isDiscountActive,
  getDiscountDaysRemaining,
  getDurationTiers,
  getBonusOffer,
  OFFER_FILTER_TYPES,
} from '@/hooks/useListingFilters';

// Mock listings data
const mockListings = [
  {
    id: '1',
    title: 'Venue with Tiered Discount',
    location: 'Kathmandu',
    hourlyRate: 1000,
    amenities: ['wifi', 'parking'],
    durationDiscounts: {
      tiers: [
        { minHours: 4, discountPercent: 10 },
        { minHours: 8, discountPercent: 20 },
      ],
    },
  },
  {
    id: '2',
    title: 'Venue with Bonus Hours',
    location: 'Pokhara',
    hourlyRate: 1500,
    amenities: ['wifi', 'ac'],
    bonusHoursOffer: { minHours: 6, bonusHours: 1 },
  },
  {
    id: '3',
    title: 'Venue on Sale',
    location: 'Lalitpur',
    hourlyRate: 2000,
    amenities: ['parking', 'ac'],
    discountPercent: 15,
    hasDiscount: true,
  },
  {
    id: '4',
    title: 'Regular Venue',
    location: 'Bhaktapur',
    hourlyRate: 800,
    amenities: ['wifi'],
  },
  {
    id: '5',
    title: 'Expired Discount Venue',
    location: 'Kathmandu',
    hourlyRate: 1200,
    discountPercent: 20,
    discountUntil: '2020-01-01',
  },
];

// ==========================================
// HELPER FUNCTIONS TESTS
// ==========================================

describe('Helper Functions', () => {
  describe('hasTieredDiscounts', () => {
    it('should return true for listing with tiered discounts', () => {
      expect(hasTieredDiscounts(mockListings[0])).toBe(true);
    });

    it('should return false for listing without tiered discounts', () => {
      expect(hasTieredDiscounts(mockListings[3])).toBe(false);
    });

    it('should return false for null/undefined listing', () => {
      expect(hasTieredDiscounts(null)).toBe(false);
      expect(hasTieredDiscounts(undefined)).toBe(false);
    });

    it('should handle array format of durationDiscounts', () => {
      const listing = {
        durationDiscounts: [
          { minHours: 4, discountPercent: 10 },
        ],
      };
      expect(hasTieredDiscounts(listing)).toBe(true);
    });
  });

  describe('hasBonusHoursOffer', () => {
    it('should return truthy for listing with bonus hours', () => {
      // The function returns the bonus offer object, not a boolean
      expect(hasBonusHoursOffer(mockListings[1])).toBeTruthy();
    });

    it('should return falsy for listing without bonus hours', () => {
      expect(hasBonusHoursOffer(mockListings[0])).toBeFalsy();
    });

    it('should return false for null/undefined listing', () => {
      expect(hasBonusHoursOffer(null)).toBeFalsy();
      expect(hasBonusHoursOffer(undefined)).toBeFalsy();
    });
  });

  describe('hasAnySpecialOffer', () => {
    it('should return true for listing with tiered discounts', () => {
      expect(hasAnySpecialOffer(mockListings[0])).toBe(true);
    });

    it('should return truthy for listing with bonus hours', () => {
      expect(hasAnySpecialOffer(mockListings[1])).toBeTruthy();
    });

    it('should return falsy for regular listing', () => {
      expect(hasAnySpecialOffer(mockListings[3])).toBeFalsy();
    });
  });

  describe('isDiscountActive', () => {
    it('should return true for active discount without dates', () => {
      const listing = { discountPercent: 10 };
      expect(isDiscountActive(listing)).toBe(true);
    });

    it('should return false for expired discount', () => {
      expect(isDiscountActive(mockListings[4])).toBe(false);
    });

    it('should return false for future discount', () => {
      const listing = {
        discountPercent: 10,
        discountFrom: '2099-01-01',
      };
      expect(isDiscountActive(listing)).toBe(false);
    });

    it('should return false for null listing', () => {
      expect(isDiscountActive(null)).toBe(false);
    });
  });

  describe('hasOnSaleDiscount', () => {
    it('should return true for listing with active discount', () => {
      expect(hasOnSaleDiscount(mockListings[2])).toBe(true);
    });

    it('should return false for listing with expired discount', () => {
      expect(hasOnSaleDiscount(mockListings[4])).toBe(false);
    });

    it('should return false for listing without discount', () => {
      expect(hasOnSaleDiscount(mockListings[3])).toBe(false);
    });
  });

  describe('getDiscountDaysRemaining', () => {
    it('should return null for listing without discountUntil', () => {
      expect(getDiscountDaysRemaining(mockListings[2])).toBeNull();
    });

    it('should return null for expired discount', () => {
      expect(getDiscountDaysRemaining(mockListings[4])).toBeNull();
    });

    it('should return days for future discount', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const listing = { discountUntil: futureDate.toISOString() };
      const days = getDiscountDaysRemaining(listing);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });
  });

  describe('getDurationTiers', () => {
    it('should return tiers array', () => {
      const tiers = getDurationTiers(mockListings[0]);
      expect(tiers).toHaveLength(2);
      expect(tiers[0].minHours).toBe(4);
    });

    it('should return empty array for listing without tiers', () => {
      expect(getDurationTiers(mockListings[3])).toEqual([]);
    });

    it('should return empty array for null listing', () => {
      expect(getDurationTiers(null)).toEqual([]);
    });
  });

  describe('getBonusOffer', () => {
    it('should return bonus offer details', () => {
      const bonus = getBonusOffer(mockListings[1]);
      expect(bonus.minHours).toBe(6);
      expect(bonus.bonusHours).toBe(1);
    });

    it('should return null for listing without bonus offer', () => {
      expect(getBonusOffer(mockListings[0])).toBeNull();
    });
  });
});

// ==========================================
// HOOK TESTS
// ==========================================

describe('useListingFilters - Initial State', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    expect(result.current.offerFilter).toBe(OFFER_FILTER_TYPES.ALL);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.priceRange).toEqual({ min: null, max: null });
    expect(result.current.selectedAmenities).toEqual([]);
  });

  it('should provide all expected methods', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    expect(typeof result.current.setOfferFilter).toBe('function');
    expect(typeof result.current.setSearchQuery).toBe('function');
    expect(typeof result.current.setPriceRange).toBe('function');
    expect(typeof result.current.setSelectedAmenities).toBe('function');
    expect(typeof result.current.filterByOfferType).toBe('function');
    expect(typeof result.current.filterBySearch).toBe('function');
    expect(typeof result.current.filterByPrice).toBe('function');
    expect(typeof result.current.filterByAmenities).toBe('function');
  });
});

describe('useListingFilters - Offer Counts', () => {
  it('should calculate correct offer counts', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    expect(result.current.offerCounts.tiered).toBe(1);
    expect(result.current.offerCounts.bonus).toBe(1);
    expect(result.current.offerCounts.sale).toBe(1);
  });

  it('should return zero counts for empty listings', () => {
    const { result } = renderHook(() => useListingFilters([]));

    expect(result.current.offerCounts).toEqual({
      all: 0,
      tiered: 0,
      bonus: 0,
      sale: 0,
    });
  });
});

describe('useListingFilters - Filter by Offer Type', () => {
  it('should filter by tiered discounts', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    act(() => {
      result.current.setOfferFilter(OFFER_FILTER_TYPES.TIERED);
    });

    expect(result.current.filteredListings).toHaveLength(1);
    expect(result.current.filteredListings[0].id).toBe('1');
  });

  it('should filter by bonus hours', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    act(() => {
      result.current.setOfferFilter(OFFER_FILTER_TYPES.BONUS);
    });

    expect(result.current.filteredListings).toHaveLength(1);
    expect(result.current.filteredListings[0].id).toBe('2');
  });

  it('should filter by on sale', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    act(() => {
      result.current.setOfferFilter(OFFER_FILTER_TYPES.ON_SALE);
    });

    expect(result.current.filteredListings).toHaveLength(1);
    expect(result.current.filteredListings[0].id).toBe('3');
  });
});

describe('useListingFilters - Filter by Search', () => {
  it('should filter by title', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterBySearch(mockListings, 'Tiered');

    expect(filtered.some(l => l.title.includes('Tiered'))).toBe(true);
  });

  it('should filter by location', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterBySearch(mockListings, 'Pokhara');

    expect(filtered.some(l => l.location === 'Pokhara')).toBe(true);
  });

  it('should filter by amenity', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterBySearch(mockListings, 'ac');

    expect(filtered.every(l => l.amenities?.includes('ac'))).toBe(true);
  });

  it('should return all listings for empty search', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterBySearch(mockListings, '');

    expect(filtered.length).toBe(mockListings.length);
  });
});

describe('useListingFilters - Filter by Price', () => {
  it('should filter by minimum price', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByPrice(mockListings, { min: 1500, max: null });

    expect(filtered.every(l => l.hourlyRate >= 1500)).toBe(true);
  });

  it('should filter by maximum price', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByPrice(mockListings, { min: null, max: 1000 });

    expect(filtered.every(l => l.hourlyRate <= 1000)).toBe(true);
  });

  it('should filter by price range', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByPrice(mockListings, { min: 1000, max: 1500 });

    expect(filtered.every(l => l.hourlyRate >= 1000 && l.hourlyRate <= 1500)).toBe(true);
  });
});

describe('useListingFilters - Filter by Amenities', () => {
  it('should filter by single amenity', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByAmenities(mockListings, ['parking']);

    expect(filtered.every(l => l.amenities?.some(a => a.includes('parking')))).toBe(true);
  });

  it('should filter by multiple amenities', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByAmenities(mockListings, ['wifi', 'parking']);

    expect(filtered.every(l => 
      l.amenities?.some(a => a.includes('wifi')) &&
      l.amenities?.some(a => a.includes('parking'))
    )).toBe(true);
  });

  it('should return all listings for empty amenities', () => {
    const { result } = renderHook(() => useListingFilters(mockListings));

    const filtered = result.current.filterByAmenities(mockListings, []);

    expect(filtered.length).toBe(mockListings.length);
  });
});
