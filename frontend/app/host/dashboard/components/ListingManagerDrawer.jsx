"use client";

import Link from "next/link";
import {
  X, Edit, Eye, Percent, DollarSign, Ban, Settings,
  Sparkles, ToggleLeft, ToggleRight, Trash2,
  Clock, Calendar, Tag, Star, TrendingUp, ChevronRight, Gift,
} from "lucide-react";

export default function ListingManageDrawer({ 
  listing, 
  isOpen, 
  onClose,
  onToggleStatus,
  onDelete,
  onManageDiscount,
  onManageSettings,
  onSpecialPricing,
  onBlockDates,
  onRequestPromotion,
  onDurationDiscounts,
}) {
  if (!isOpen || !listing) return null;

  const hasDiscount = listing.discountPercent > 0;
  const discountExpired = listing.discountUntil && new Date(listing.discountUntil) < new Date();
  const isFeatured = listing.isFeatured && listing.featuredUntil && new Date(listing.featuredUntil) > new Date();
  
  // Check for duration discounts - handle nested { tiers: [...] } structure
  const durationTiers = listing.durationDiscounts?.tiers || 
    (Array.isArray(listing.durationDiscounts) ? listing.durationDiscounts : []);
  const hasDurationDiscounts = durationTiers.length > 0;
  
  // Check for bonus offer
  const hasBonusOffer = listing.bonusHoursOffer && listing.bonusHoursOffer.minHours;

  const MenuItem = ({ icon: Icon, label, description, onClick, href, color = "gray", badge, secondBadge }) => {
    const colorClasses = {
      gray: "bg-gray-100 group-hover:bg-gray-200 text-gray-600",
      blue: "bg-blue-100 group-hover:bg-blue-200 text-blue-600",
      red: "bg-red-100 group-hover:bg-red-200 text-red-600",
      purple: "bg-purple-100 group-hover:bg-purple-200 text-purple-600",
      orange: "bg-orange-100 group-hover:bg-orange-200 text-orange-600",
      amber: "bg-amber-100 group-hover:bg-amber-200 text-amber-600",
      green: "bg-green-100 group-hover:bg-green-200 text-green-600",
      indigo: "bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600",
    };

    const hoverClasses = {
      gray: "hover:bg-gray-50",
      blue: "hover:bg-blue-50",
      red: "hover:bg-red-50",
      purple: "hover:bg-purple-50",
      orange: "hover:bg-orange-50",
      amber: "hover:bg-amber-50",
      green: "hover:bg-green-50",
      indigo: "hover:bg-indigo-50",
    };

    const content = (
      <div className={`flex items-center gap-4 p-4 ${hoverClasses[color]} rounded-xl transition-colors cursor-pointer group`}>
        <div className={`p-3 rounded-xl transition-colors ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{label}</span>
            {badge && (
              <span className={`px-2 py-0.5 text-xs rounded-full bg-${badge.color}-100 text-${badge.color}-700`}>
                {badge.text}
              </span>
            )}
            {secondBadge && (
              <span className={`px-2 py-0.5 text-xs rounded-full bg-${secondBadge.color}-100 text-${secondBadge.color}-700`}>
                {secondBadge.text}
              </span>
            )}
          </div>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
      </div>
    );

    if (href) {
      return <Link href={href} onClick={onClose}>{content}</Link>;
    }
    return <div onClick={onClick}>{content}</div>;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex-shrink-0 border-b">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-gray-900 line-clamp-2">{listing.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{listing.location}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    listing.status === "ACTIVE" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {listing.status}
                  </span>
                  {isFeatured && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  {hasDiscount && !discountExpired && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      {listing.discountPercent}% OFF
                    </span>
                  )}
                  {hasDurationDiscounts && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Tiered
                    </span>
                  )}
                  {hasBonusOffer && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Bonus
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="px-6 pb-4 flex gap-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">Rs.{listing.hourlyRate}</p>
              <p className="text-xs text-gray-500">per hour</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{listing._count?.bookings || 0}</p>
              <p className="text-xs text-gray-500">bookings</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{listing.capacity}</p>
              <p className="text-xs text-gray-500">capacity</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <MenuItem
                icon={Edit}
                label="Edit Listing"
                description="Update details, photos, amenities"
                href={`/host/listings/${listing.id}/edit`}
                color="blue"
              />
              <MenuItem
                icon={Eye}
                label="View Public Page"
                description="See how guests view your listing"
                href={`/public/listings/${listing.id}`}
                color="gray"
              />
            </div>
          </div>

          {/* Pricing & Discounts */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing & Discounts</h3>
            <div className="space-y-2">
              {/* Duration Discounts */}
              <MenuItem
                icon={TrendingUp}
                label="Duration Discounts"
                description={
                  hasDurationDiscounts 
                    ? `${durationTiers.length} tier${durationTiers.length > 1 ? 's' : ''} active`
                    : "Offer discounts for longer bookings"
                }
                onClick={() => { onDurationDiscounts?.(listing); onClose(); }}
                color="indigo"
                badge={hasDurationDiscounts ? { text: `${durationTiers.length} tiers`, color: "indigo" } : null}
                secondBadge={hasBonusOffer ? { text: "Bonus", color: "green" } : null}
              />

              <MenuItem
                icon={Percent}
                label={hasDiscount ? "Edit Sale Discount" : "Add Sale Discount"}
                description={hasDiscount ? `Currently ${listing.discountPercent}% off` : "Run a limited-time sale"}
                onClick={() => { onManageDiscount(listing); onClose(); }}
                color="red"
                badge={hasDiscount && !discountExpired ? { text: "Active", color: "red" } : null}
              />

              <MenuItem
                icon={DollarSign}
                label="Special Date Pricing"
                description="Set custom rates for holidays & weekends"
                onClick={() => { onSpecialPricing(listing); onClose(); }}
                color="purple"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Availability</h3>
            <div className="space-y-2">
              <MenuItem
                icon={Ban}
                label="Block Dates"
                description="Mark dates as unavailable"
                onClick={() => { onBlockDates(listing); onClose(); }}
                color="orange"
              />
              <MenuItem
                icon={Settings}
                label="Booking Settings"
                description="Advance notice, duration limits, auto-confirm"
                onClick={() => { onManageSettings(listing); onClose(); }}
                color="blue"
              />
            </div>
          </div>

          {/* Promotion */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Promotion</h3>
            <div className="space-y-2">
              <MenuItem
                icon={Sparkles}
                label={isFeatured ? "View Promotion Status" : "Request Featured"}
                description={isFeatured ? "Your listing is featured!" : "Get more visibility on homepage"}
                onClick={() => { onRequestPromotion(listing); onClose(); }}
                color="amber"
                badge={isFeatured ? { text: "Featured", color: "amber" } : null}
              />
            </div>
          </div>

          {/* Status & Danger Zone */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-2">
              <div 
                onClick={() => { onToggleStatus(listing); onClose(); }}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
              >
                <div className={`p-3 rounded-xl transition-colors ${
                  listing.status === "ACTIVE" 
                    ? "bg-yellow-100 group-hover:bg-yellow-200" 
                    : "bg-green-100 group-hover:bg-green-200"
                }`}>
                  {listing.status === "ACTIVE" 
                    ? <ToggleLeft className="w-5 h-5 text-yellow-600" />
                    : <ToggleRight className="w-5 h-5 text-green-600" />
                  }
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {listing.status === "ACTIVE" ? "Deactivate Listing" : "Activate Listing"}
                  </span>
                  <p className="text-sm text-gray-500">
                    {listing.status === "ACTIVE" 
                      ? "Temporarily hide from search results" 
                      : "Make visible to guests again"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t">
            <div 
              onClick={() => { onDelete(listing); onClose(); }}
              className="flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-red-600">Delete Listing</span>
                <p className="text-sm text-red-400">Permanently remove this listing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t p-4 bg-gray-50">
          <Link
            href={`/host/listings/${listing.id}/edit`}
            onClick={onClose}
            className="block w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Edit Full Listing
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}