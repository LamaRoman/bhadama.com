// components/home/ListingCard.jsx
"use client";

import Link from "next/link";
import { Gift, TrendingUp, Percent, Star, MapPin, Users, Tag, Clock } from "lucide-react";

// Helper functions (inline to avoid import issues during transition)
const getDurationTiers = (listing) => {
  if (!listing?.durationDiscounts) return [];
  if (listing.durationDiscounts.tiers && Array.isArray(listing.durationDiscounts.tiers)) {
    return listing.durationDiscounts.tiers;
  }
  if (Array.isArray(listing.durationDiscounts)) {
    return listing.durationDiscounts;
  }
  return [];
};

const getBonusOffer = (listing) => {
  if (!listing?.bonusHoursOffer?.minHours) return null;
  return listing.bonusHoursOffer;
};

// Check if discount is currently active
const isDiscountActive = (listing) => {
  if (!listing.discountPercent || listing.discountPercent <= 0) return false;
  
  const now = new Date();
  
  // Check if discount has started (if discountFrom is set)
  if (listing.discountFrom) {
    const fromDate = new Date(listing.discountFrom);
    if (now < fromDate) return false; // Discount hasn't started yet
  }
  
  // Check if discount has expired (if discountUntil is set)
  if (listing.discountUntil) {
    const untilDate = new Date(listing.discountUntil);
    if (now > untilDate) return false; // Discount has expired
  }
  
  return true;
};

// Calculate days remaining for discount
const getDiscountDaysRemaining = (listing) => {
  if (!listing.discountUntil) return null;
  
  const now = new Date();
  const untilDate = new Date(listing.discountUntil);
  const diffTime = untilDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : null;
};

export default function ListingCard({ listing, showBadge = true }) {
  const {
    id,
    title,
    location,
    originalPrice,
    discountedPrice,
    discountPercent,
    discountReason,
    discountFrom,
    discountUntil,
    hasDiscount,
    isFeatured,
    isNew,
    coverImage,
    reviewCount,
    capacity,
    amenities = [],
  } = listing;

  // Get offer details
  const durationTiers = getDurationTiers(listing);
  const bonusOffer = getBonusOffer(listing);
  const hasTiered = durationTiers.length > 0;
  const hasBonus = !!bonusOffer;
  const hasSpecialOffer = hasTiered || hasBonus;

  // Check if flat discount is active
  const discountActive = isDiscountActive(listing);
  const daysRemaining = getDiscountDaysRemaining(listing);
  const showDiscount = hasDiscount && discountActive;

  // Show first 3 amenities only if no special offers to display
  const displayAmenities = amenities?.slice(0, 3) || [];

  return (
    <Link href={`/public/listings/${id}`}>
      <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-stone-100">
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {title?.charAt(0)}
              </span>
            </div>
          )}

          {/* Top Left Badges */}
          {showBadge && (
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {/* Sale/Discount Reason Tag - Most prominent */}
              {showDiscount && discountReason && (
                <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-md">
                  <Tag className="w-2.5 h-2.5" />
                  {discountReason}
                </span>
              )}
              
              {/* Featured Badge */}
              {isFeatured && (
                <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Featured
                </span>
              )}
              
              {/* New Badge */}
              {isNew && !isFeatured && (
                <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                  New
                </span>
              )}
              
              {/* Tiered Deals Badge */}
              {hasTiered && (
                <span className="px-2 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Tiered Deals
                </span>
              )}
              
              {/* Bonus Hours Badge */}
              {hasBonus && (
                <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                  <Gift className="w-2.5 h-2.5" />
                  Bonus Hours
                </span>
              )}
            </div>
          )}

          {/* Top Right - Discount Percentage & Urgency */}
          {showDiscount && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                <Percent className="w-2.5 h-2.5" />
                {discountPercent}% OFF
              </span>
              
              {/* Urgency - Days remaining */}
              {daysRemaining && daysRemaining <= 7 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                  <Clock className="w-2 h-2" />
                  {daysRemaining === 1 ? "Ends today!" : `${daysRemaining} days left`}
                </span>
              )}
            </div>
          )}

          {/* Price on Image */}
          <div className="absolute bottom-2 right-2">
            <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm">
              {showDiscount ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-red-600">
                    Rs.{discountedPrice}
                  </span>
                  <span className="text-[10px] text-stone-400 line-through">
                    Rs.{originalPrice}
                  </span>
                  <span className="text-[10px] text-stone-500">/hr</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-stone-900">
                    Rs.{originalPrice}
                  </span>
                  <span className="text-[10px] text-stone-500">/hr</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-sm mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-stone-500 text-xs mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Tiered Discounts Preview */}
          {hasTiered && (
            <div className="flex flex-wrap gap-1 mb-2">
              {durationTiers.slice(0, 2).map((tier, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded border border-indigo-100"
                >
                  {tier.minHours}h+: {tier.discountPercent}% off
                </span>
              ))}
              {durationTiers.length > 2 && (
                <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded">
                  +{durationTiers.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Bonus Hours Offer */}
          {hasBonus && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md border border-emerald-100 mb-2">
              <Gift className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">
                {bonusOffer.label ||
                  `Book ${bonusOffer.minHours}+ hrs, get ${bonusOffer.bonusHours}hr FREE`}
              </span>
            </div>
          )}

          {/* Sale Info Banner - Show when discount is active but no reason tag shown */}
          {showDiscount && !discountReason && !hasTiered && !hasBonus && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-[10px] font-medium rounded-md border border-red-100 mb-2">
              <Tag className="w-3 h-3 flex-shrink-0" />
              <span>Limited time {discountPercent}% discount!</span>
            </div>
          )}

          {/* Amenities - Only show if no special offers displayed */}
          {!hasSpecialOffer && !showDiscount && displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayAmenities.map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-100"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-md">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Bottom Row - Stats */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2">
              {capacity && (
                <span className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {capacity}
                </span>
              )}
            </div>
            {reviewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {reviewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}