"use client";

import Link from "next/link";

export default function ListingCard({ listing, showBadge = true }) {
  const {
    id,
    title,
    location,
    originalPrice,
    discountedPrice,
    discountPercent,
    hasDiscount,
    isFeatured,
    isNew,
    coverImage,
    reviewCount,
    capacity,
    amenities = [],
  } = listing;

  // Show first 3 amenities
  const displayAmenities = amenities?.slice(0, 3) || [];

  return (
    <Link href={`/public/listings/${id}`}>
      <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-stone-100">
        {/* Image Container - Smaller */}
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">{title?.charAt(0)}</span>
            </div>
          )}

          {/* Badges - Smaller */}
          {showBadge && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {isFeatured && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  ⭐ Featured
                </span>
              )}
              {isNew && !isFeatured && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                  New
                </span>
              )}
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Price on Image */}
          <div className="absolute bottom-2 right-2">
            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow">
              {hasDiscount ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-emerald-600">${discountedPrice}</span>
                  <span className="text-[10px] text-stone-400 line-through">${originalPrice}</span>
                  <span className="text-[10px] text-stone-500">/hr</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-stone-900">${originalPrice}</span>
                  <span className="text-[10px] text-stone-500">/hr</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-sm mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-stone-500 text-xs mb-2">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Amenities/Features - More Visible */}
          {displayAmenities.length > 0 && (
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
          <div className="flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-2">
              {capacity && (
                <span className="flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {capacity}
                </span>
              )}
            </div>
            {reviewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {reviewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}