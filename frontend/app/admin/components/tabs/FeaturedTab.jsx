"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api.js";
import { toast } from "react-hot-toast";
import { Star, Search, Check, X, TrendingUp, Clock } from "lucide-react";

export default function FeaturedTab() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("featured"); // "featured" | "all"

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allListings, featured] = await Promise.all([
        api("/api/admin/listings?limit=100"),
        api("/api/discover/featured?limit=50")
      ]);
      
      setListings(allListings.listings || []);
      setFeaturedListings(featured || []);
    } catch (error) {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFeature = async (listingId, isFeatured, priority = 0, durationDays = null) => {
    try {
      await api(`/api/discover/admin/feature/${listingId}`, {
        method: "PUT",
        body: { isFeatured, priority, durationDays }
      });
      toast.success(isFeatured ? "Listing featured!" : "Listing unfeatured");
      fetchData();
    } catch (error) {
      toast.error("Failed to update featured status");
    }
  };

  const handleQuickFeature = async (listingId) => {
    await handleFeature(listingId, true, 1, 7); // Feature for 7 days with priority 1
  };

  const handleUnfeature = async (listingId) => {
    await handleFeature(listingId, false, 0, null);
  };

  const filteredListings = listings.filter(listing =>
    listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nonFeaturedListings = filteredListings.filter(
    listing => !listing.isFeatured
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Featured Listings Management</h2>
          <p className="text-gray-600">Manage which listings appear in the featured section</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{featuredListings.length}</p>
              <p className="text-sm text-amber-600">Featured Listings</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{listings.length}</p>
              <p className="text-sm text-blue-600">Total Active Listings</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {featuredListings.filter(l => l.featuredUntil).length}
              </p>
              <p className="text-sm text-green-600">With Expiry Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSection("featured")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeSection === "featured"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⭐ Currently Featured ({featuredListings.length})
          </button>
          <button
            onClick={() => setActiveSection("all")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeSection === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📋 All Listings ({nonFeaturedListings.length})
          </button>
        </nav>
      </div>

      {/* Featured Listings Section */}
      {activeSection === "featured" && (
        <div className="space-y-4">
          {featuredListings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Featured Listings</h3>
              <p className="text-gray-500 mb-4">Add listings to the featured section from the "All Listings" tab</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {featuredListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-amber-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {listing.coverImage ? (
                              <img src={listing.coverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{listing.title}</p>
                            <p className="text-sm text-gray-500">{listing.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Priority {listing.featuredPriority || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {listing.featuredUntil ? (
                          <span className="text-orange-600">
                            {new Date(listing.featuredUntil).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-green-600">No expiry</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👁 {listing.viewCount || 0}</span>
                          <span>📅 {listing.bookingCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUnfeature(listing.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Listings Section */}
      {activeSection === "all" && (
        <div className="space-y-4">
          {nonFeaturedListings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Check className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Listings Featured!</h3>
              <p className="text-gray-500">Every active listing is already in the featured section</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Host</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {nonFeaturedListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-blue-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {listing.images?.[0]?.url ? (
                              <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{listing.title}</p>
                            <p className="text-sm text-gray-500">{listing.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {listing.host?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          ${Number(listing.hourlyRate || 0)}/hr
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>⭐ {listing._count?.reviews || 0}</span>
                          <span>📅 {listing._count?.bookings || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuickFeature(listing.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                            Feature
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}