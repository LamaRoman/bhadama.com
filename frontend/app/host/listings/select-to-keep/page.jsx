"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext.js";
import { api } from "../../../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  Check,
  AlertTriangle,
  Clock,
  Star,
  Eye,
  Calendar,
  Archive,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function SelectListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api("/api/host/tier/listings/over-limit");

        if (result.error) {
          toast.error(result.error);
          router.push("/host/dashboard");
          return;
        }

        setData(result);

        // Pre-select listings up to the limit (newest first)
        if (result.listings && result.limit !== "Unlimited") {
          const limit = parseInt(result.limit);
          const activeListings = result.listings
            .filter((l) => l.status !== "OVER_LIMIT")
            .slice(0, limit)
            .map((l) => l.id);
          setSelectedIds(activeListings);
        }
      } catch (error) {
        toast.error("Failed to load listings");
        router.push("/host/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, router]);

  const toggleSelection = (listingId) => {
    const limit = typeof data.limit === "number" ? data.limit : parseInt(data.limit);
    
    if (selectedIds.includes(listingId)) {
      setSelectedIds(selectedIds.filter((id) => id !== listingId));
    } else {
      if (selectedIds.length >= limit) {
        toast.error(`You can only keep ${limit} listings active`);
        return;
      }
      setSelectedIds([...selectedIds, listingId]);
    }
  };

  const handleConfirm = async () => {
    const limit = typeof data.limit === "number" ? data.limit : parseInt(data.limit);
    
    if (selectedIds.length > limit) {
      toast.error(`Please select only ${limit} listings`);
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one listing to keep");
      return;
    }

    setProcessing(true);
    try {
      const result = await api("/api/host/tier/listings/select-to-keep", {
        method: "POST",
        body: { listingIds: selectedIds },
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      router.push("/host/dashboard");
    } catch (error) {
      toast.error("Failed to save selection");
    } finally {
      setProcessing(false);
    }
  };

  const formatTimeRemaining = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data || !data.gracePeriodActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">All Good!</h2>
          <p className="text-gray-600 mb-4">
            You don't have any listings to manage right now.
          </p>
          <button
            onClick={() => router.push("/host/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const limit = typeof data.limit === "number" ? data.limit : parseInt(data.limit);
  const toArchive = data.listings.filter((l) => !selectedIds.includes(l.id));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-900">
                Select Listings to Keep Active
              </h2>
              <p className="text-amber-800 text-sm mt-1">
                Your current plan allows only <strong>{limit}</strong> active listings.
                You have <strong>{data.currentCount}</strong> listings.
                Please select which {limit} listings you want to keep active.
              </p>
            </div>
          </div>
        </div>

        {/* Timer */}
        {data.selectionDeadline && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">Time Remaining</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {formatTimeRemaining(data.selectionDeadline)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              If you don't select, the oldest listings will be automatically archived.
            </p>
          </div>
        )}

        {/* Selection Counter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Selected Listings</span>
            <span
              className={`text-lg font-bold ${
                selectedIds.length === limit
                  ? "text-green-600"
                  : selectedIds.length > limit
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {selectedIds.length} / {limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                selectedIds.length === limit
                  ? "bg-green-500"
                  : selectedIds.length > limit
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.min((selectedIds.length / limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Listings Grid */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">Your Listings</h3>
          
          {data.listings.map((listing) => {
            const isSelected = selectedIds.includes(listing.id);
            const isOverLimit = listing.status === "OVER_LIMIT";

            return (
              <div
                key={listing.id}
                onClick={() => toggleSelection(listing.id)}
                className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : isOverLimit
                    ? "border-orange-300 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Image */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {listing.coverImage ? (
                      <img
                        src={listing.coverImage}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {listing.title}
                      </h4>
                      {isOverLimit && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                          Over Limit
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {listing.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {listing.averageRating}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {listing.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {listing.bookingCount} bookings
                      </span>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Archive Preview */}
        {toArchive.length > 0 && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Archive className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">
                {toArchive.length} listing{toArchive.length > 1 ? "s" : ""} will be archived
              </span>
            </div>
            <div className="space-y-2">
              {toArchive.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span>{listing.title}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Archived listings are not deleted. You can restore them by upgrading your plan.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleConfirm}
            disabled={processing || selectedIds.length === 0 || selectedIds.length > limit}
            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Selection
              </>
            )}
          </button>

          <button
            onClick={() => router.push("/host/select-tier")}
            className="flex-1 py-4 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Upgrade Instead
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can always change your selection before the deadline or restore archived listings by upgrading.
        </p>
      </div>
    </div>
  );
}