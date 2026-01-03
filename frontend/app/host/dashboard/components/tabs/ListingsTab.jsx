"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../utils/api.js";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Plus, Building, Edit, Eye,
  MapPin, Users, Clock, Star,
  ChevronLeft, ChevronRight, Percent, Tag, Settings, TrendingUp, Gift,
} from "lucide-react";
import DiscountModal from "../DiscountModal";
import BookingSettingsModal from "../BookingSettingsModal";
import SpecialPricingModal from "../SpecialPricingModal";
import BlockDatesModal from "../BlockDatesModal";
import PromotionRequestModal from "../PromotionRequestModal";
import ListingManageDrawer from "../ListingManagerDrawer.jsx";
import DurationDiscountsModal from "../DurationDiscountsModal";

const LISTINGS_PER_PAGE = 6;

const LISTING_STATUS_STYLES = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

// Helper function to get duration tiers from listing
const getDurationTiers = (listing) => {
  if (!listing.durationDiscounts) return [];
  if (listing.durationDiscounts.tiers && Array.isArray(listing.durationDiscounts.tiers)) {
    return listing.durationDiscounts.tiers;
  }
  if (Array.isArray(listing.durationDiscounts)) {
    return listing.durationDiscounts;
  }
  return [];
};

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg disabled:opacity-40 hover:bg-gray-100 text-sm"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <span className="text-sm text-gray-500">Page {current} of {total}</span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex items-center gap-1 px-3 py-2 rounded-lg disabled:opacity-40 hover:bg-gray-100 text-sm"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ListingCard({ listing, onManage }) {
  const hasDiscount = listing.discountPercent > 0;
  const discountExpired = listing.discountUntil && new Date(listing.discountUntil) < new Date();
  const isFeatured = listing.isFeatured && listing.featuredUntil && new Date(listing.featuredUntil) > new Date();
  const durationTiers = getDurationTiers(listing);
  const hasDurationDiscounts = durationTiers.length > 0;
  const hasBonusOffer = listing.bonusHoursOffer && listing.bonusHoursOffer.minHours;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={listing.images?.[0]?.url || "/placeholder.jpg"}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${LISTING_STATUS_STYLES[listing.status] || LISTING_STATUS_STYLES.INACTIVE}`}>
            {listing.status}
          </span>
          {isFeatured && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          )}
          {hasDiscount && !discountExpired && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white flex items-center gap-1">
              <Percent className="w-3 h-3" /> {listing.discountPercent}% OFF
            </span>
          )}
          {hasDurationDiscounts && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500 text-white flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Tiered
            </span>
          )}
          {hasBonusOffer && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500 text-white flex items-center gap-1">
              <Gift className="w-3 h-3" /> Bonus
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <a href={`/public/listings/${listing.id}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors cursor-pointer" title="View">
            <Eye className="w-4 h-4 text-gray-700" />
          </a>
          <a href={`/host/listings/${listing.id}/edit`} onClick={(e) => e.stopPropagation()} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors cursor-pointer" title="Edit">
            <Edit className="w-4 h-4 text-gray-700" />
          </a>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {listing.capacity || 0}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {hasDiscount && !discountExpired ? (
              <>
                <span className="line-through text-gray-400">Rs.{listing.hourlyRate}</span>
                <span className="text-green-600 font-medium">Rs.{(parseFloat(listing.hourlyRate) * (1 - listing.discountPercent / 100)).toFixed(0)}/hr</span>
              </>
            ) : (
              <span>Rs.{listing.hourlyRate}/hr</span>
            )}
          </span>
        </div>
        {hasDiscount && !discountExpired && listing.discountReason && (
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-3">
            <Tag className="w-3 h-3" /> {listing.discountReason}
          </div>
        )}
        {hasDurationDiscounts && (
          <div className="flex flex-wrap gap-1 mb-3">
            {durationTiers.slice(0, 3).map((tier, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full">
                {tier.minHours}h+: {tier.discountPercent}% off
              </span>
            ))}
          </div>
        )}
        {hasBonusOffer && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
            <Gift className="w-3 h-3" />
            {listing.bonusHoursOffer.label || `Book ${listing.bonusHoursOffer.minHours}+ hrs, get ${listing.bonusHoursOffer.bonusHours}hr FREE`}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-500">Bookings: </span>
            <span className="font-semibold text-gray-900">{listing._count?.bookings || 0}</span>
          </div>
          <button onClick={() => onManage(listing)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" /> Manage
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingsTab({ refreshKey }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [manageDrawer, setManageDrawer] = useState({ isOpen: false, listing: null });
  const [discountModal, setDiscountModal] = useState({ isOpen: false, listing: null });
  const [settingsModal, setSettingsModal] = useState({ isOpen: false, listing: null });
  const [specialPricingModal, setSpecialPricingModal] = useState({ isOpen: false, listing: null });
  const [blockDatesModal, setBlockDatesModal] = useState({ isOpen: false, listing: null });
  const [promotionModal, setPromotionModal] = useState({ isOpen: false, listing: null });
  const [durationDiscountsModal, setDurationDiscountsModal] = useState({ isOpen: false, listing: null });

  useEffect(() => { fetchListings(); }, [refreshKey]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await api("/api/host/listings");
      setListings(data.listings || data || []);
    } catch (e) {
      console.error("Failed to fetch listings:", e);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    if (filter === "all") return listings;
    if (filter === "discounted") return listings.filter(l => l.discountPercent > 0);
    if (filter === "tiered") return listings.filter(l => getDurationTiers(l).length > 0);
    if (filter === "bonus") return listings.filter(l => l.bonusHoursOffer && l.bonusHoursOffer.minHours);
    return listings.filter(l => l.status === filter);
  }, [listings, filter]);

  const totalPages = useMemo(() => Math.ceil(filteredListings.length / LISTINGS_PER_PAGE), [filteredListings.length]);
  const paginatedListings = useMemo(() => {
    const start = (page - 1) * LISTINGS_PER_PAGE;
    return filteredListings.slice(start, start + LISTINGS_PER_PAGE);
  }, [filteredListings, page]);

  const stats = useMemo(() => ({
    total: listings.length,
    active: listings.filter(l => l.status === "ACTIVE").length,
    inactive: listings.filter(l => l.status === "INACTIVE").length,
    pending: listings.filter(l => l.status === "PENDING").length,
    discounted: listings.filter(l => l.discountPercent > 0).length,
    tiered: listings.filter(l => getDurationTiers(l).length > 0).length,
    bonus: listings.filter(l => l.bonusHoursOffer && l.bonusHoursOffer.minHours).length,
  }), [listings]);

  const handleToggleStatus = async (listing) => {
    const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api(`/api/host/listings/${listing.id}`, { method: "PATCH", body: { status: newStatus } });
      setListings(prev => prev.map(l => (l.id === listing.id ? { ...l, status: newStatus } : l)));
      toast.success(`Listing ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error("Failed to update listing status");
    }
  };

  const handleDelete = async (listing) => {
    if (!confirm(`Are you sure you want to delete "${listing.title}"?`)) return;
    try {
      await api(`/api/host/listings/${listing.id}`, { method: "DELETE" });
      setListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success("Listing deleted");
    } catch (e) {
      toast.error("Failed to delete listing");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (<div key={i} className="h-72 bg-gray-100 animate-pulse rounded-xl" />))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
          <p className="text-gray-600">Manage your properties</p>
        </div>
        <Link href="/host/listings/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" /> Add New Listing
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-700">{stats.active}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
          <div className="text-sm text-gray-500">Inactive</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-3xl font-bold text-red-600">{stats.discounted}</div>
          <div className="text-sm text-red-500">On Sale</div>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
          <div className="text-3xl font-bold text-indigo-600">{stats.tiered}</div>
          <div className="text-sm text-indigo-500">Tiered</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-3xl font-bold text-emerald-600">{stats.bonus}</div>
          <div className="text-sm text-emerald-500">Bonus</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Filter:</span>
        {[
          { value: "all", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "PENDING", label: "Pending" },
          { value: "discounted", label: "🏷️ On Sale" },
          { value: "tiered", label: "📊 Tiered" },
          { value: "bonus", label: "🎁 Bonus" },
        ].map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f.value ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {paginatedListings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onManage={(listing) => setManageDrawer({ isOpen: true, listing })} />
            ))}
          </div>
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{filter === "all" ? "No listings yet" : `No ${filter.toLowerCase()} listings`}</h3>
          <p className="text-gray-500 mb-6">{filter === "all" ? "Start by creating your first listing" : "Try a different filter"}</p>
          {filter === "all" && (
            <Link href="/host/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
              <Plus className="w-5 h-5" /> Create Listing
            </Link>
          )}
        </div>
      )}

      <ListingManageDrawer
        listing={manageDrawer.listing}
        isOpen={manageDrawer.isOpen}
        onClose={() => setManageDrawer({ isOpen: false, listing: null })}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        onManageDiscount={(listing) => setDiscountModal({ isOpen: true, listing })}
        onManageSettings={(listing) => setSettingsModal({ isOpen: true, listing })}
        onSpecialPricing={(listing) => setSpecialPricingModal({ isOpen: true, listing })}
        onBlockDates={(listing) => setBlockDatesModal({ isOpen: true, listing })}
        onRequestPromotion={(listing) => setPromotionModal({ isOpen: true, listing })}
        onDurationDiscounts={(listing) => setDurationDiscountsModal({ isOpen: true, listing })}
      />

      <DiscountModal listing={discountModal.listing} isOpen={discountModal.isOpen} onClose={() => setDiscountModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
      <BookingSettingsModal listing={settingsModal.listing} isOpen={settingsModal.isOpen} onClose={() => setSettingsModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
      <SpecialPricingModal listing={specialPricingModal.listing} isOpen={specialPricingModal.isOpen} onClose={() => setSpecialPricingModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
      <BlockDatesModal listing={blockDatesModal.listing} isOpen={blockDatesModal.isOpen} onClose={() => setBlockDatesModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
      <PromotionRequestModal listing={promotionModal.listing} isOpen={promotionModal.isOpen} onClose={() => setPromotionModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
      <DurationDiscountsModal listing={durationDiscountsModal.listing} isOpen={durationDiscountsModal.isOpen} onClose={() => setDurationDiscountsModal({ isOpen: false, listing: null })} onUpdate={fetchListings} />
    </div>
  );
}