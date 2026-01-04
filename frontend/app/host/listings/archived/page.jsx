"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext.js";
import { api } from "../../../../utils/api.js";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  Archive,
  RotateCcw,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ArchivedListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

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
        const [archivedData, limitsData] = await Promise.all([
          api("/api/host/tier/listings/archived"),
          api("/api/host/tier/limits"),
        ]);

        if (archivedData.error) {
          toast.error(archivedData.error);
          return;
        }

        setData(archivedData);
        setLimits(limitsData);
      } catch (error) {
        toast.error("Failed to load archived listings");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleRestore = async (listingId) => {
    // Check if can restore
    if (limits && !limits.limits.listings.unlimited) {
      const available = limits.limits.listings.max - limits.limits.listings.used;
      if (available <= 0) {
        toast.error(
          `You're at your listing limit (${limits.limits.listings.max}). Upgrade to restore more.`
        );
        return;
      }
    }

    setRestoring(listingId);
    try {
      const result = await api(`/api/host/tier/listings/${listingId}/restore`, {
        method: "POST",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);

      // Refresh data
      const [archivedData, limitsData] = await Promise.all([
        api("/api/host/tier/listings/archived"),
        api("/api/host/tier/limits"),
      ]);
      setData(archivedData);
      setLimits(limitsData);
    } catch (error) {
      toast.error("Failed to restore listing");
    } finally {
      setRestoring(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const canRestore =
    limits?.limits.listings.unlimited ||
    limits?.limits.listings.used < limits?.limits.listings.max;

  const slotsAvailable = limits?.limits.listings.unlimited
    ? "Unlimited"
    : limits?.limits.listings.max - limits?.limits.listings.used;

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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archived Listings</h1>
            <p className="text-gray-600">
              {data?.count || 0} archived listing{data?.count !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Slots Available */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">Available Slots</p>
            <p className="text-xl font-bold text-blue-600">{slotsAvailable}</p>
          </div>
        </div>

        {/* Info Banner */}
        {!canRestore && data?.count > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-amber-900">
                  No Available Slots
                </h2>
                <p className="text-amber-800 text-sm mt-1">
                  You've reached your listing limit. Upgrade your plan to restore archived listings.
                </p>
                <button
                  onClick={() => router.push("/host/select-tier")}
                  className="mt-2 flex items-center gap-2 text-amber-700 font-medium hover:text-amber-900"
                >
                  <TrendingUp className="w-4 h-4" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archived Listings */}
        {data?.listings && data.listings.length > 0 ? (
          <div className="space-y-4">
            {data.listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {listing.coverImage ? (
                      <img
                        src={listing.coverImage}
                        alt={listing.title}
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {listing.title}
                    </h4>
                    <p className="text-sm text-gray-500">{listing.location}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archived {new Date(listing.archivedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {listing.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {listing.bookingCount} bookings
                      </span>
                    </div>
                    {listing.archivedReason && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        Reason: {listing.archivedReason.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Restore Button */}
                  <button
                    onClick={() => handleRestore(listing.id)}
                    disabled={!canRestore || restoring === listing.id}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                      canRestore
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {restoring === listing.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              No Archived Listings
            </h3>
            <p className="text-gray-500 mt-2">
              All your listings are active. Great job!
            </p>
            <button
              onClick={() => router.push("/host/listings")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Active Listings
            </button>
          </div>
        )}

        {/* Upgrade CTA */}
        {data?.count > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Want to restore all listings?</h3>
                <p className="text-purple-100 mt-1">
                  Upgrade your plan for more listing slots and premium features.
                </p>
              </div>
              <button
                onClick={() => router.push("/host/select-tier")}
                className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}