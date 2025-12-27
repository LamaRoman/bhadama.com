"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api.js";
import { LoadingSpinner, EmptyState, ActionButton, formatDate } from "../shared";
import { Home, Star, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ModerationTab() {
  const [loading, setLoading] = useState(true);
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeSection, setActiveSection] = useState("listings");

 const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const [reviewsRes, listingsRes] = await Promise.all([
      api(`/api/admin/reviews?status=PENDING&limit=20`).catch(() => []), // reviews array
      api('/api/admin/listings?status=PENDING&limit=20').catch(() => []) // listings array
    ]);

    setPendingListings(Array.isArray(listingsRes) ? listingsRes : []);
    setPendingReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
  } catch (error) {
    toast.error("Failed to load moderation queue");
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApproveListing = async (id) => {
    try {
      await api(`/api/admin/listings/${id}/status`, { method: 'PUT', body: { status: 'ACTIVE' } });
      toast.success("Listing approved");
      fetchData();
    } catch (error) { toast.error("Failed to approve"); }
  };

  const handleRejectListing = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await api(`/api/admin/listings/${id}/status`, { method: 'PUT', body: { status: 'REJECTED', reason } });
      toast.success("Listing rejected");
      fetchData();
    } catch (error) { toast.error("Failed to reject"); }
  };

  const handleApproveReview = async (id) => {
    try {
      await api(`/api/admin/reviews/${id}/status`, { method: 'PUT', body: { status: 'APPROVED' } });
      toast.success("Review approved");
      fetchData();
    } catch (error) { toast.error("Failed to approve"); }
  };

  const handleRejectReview = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await api(`/api/admin/reviews/${id}/status`, { method: 'PUT', body: { status: 'REJECTED', reason } });
      toast.success("Review rejected");
      fetchData();
    } catch (error) { toast.error("Failed to reject"); }
  };

  if (loading) return <LoadingSpinner message="Loading moderation queue..." />;

  const totalPending = pendingListings.length + pendingReviews.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Content Moderation</h2>
        <p className="text-gray-600">Review and moderate user-submitted content</p>
      </div>

      {totalPending > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-yellow-800">{totalPending} Items Pending Review</h3>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-green-800">All Caught Up!</h3>
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveSection("listings")}
          className={`pb-3 px-1 font-medium flex items-center gap-2 ${activeSection === "listings" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}>
          <Home className="w-4 h-4" /> Listings
          {pendingListings.length > 0 && <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{pendingListings.length}</span>}
        </button>
        <button onClick={() => setActiveSection("reviews")}
          className={`pb-3 px-1 font-medium flex items-center gap-2 ${activeSection === "reviews" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}>
          <Star className="w-4 h-4" /> Reviews
          {pendingReviews.length > 0 && <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{pendingReviews.length}</span>}
        </button>
      </div>

      {activeSection === "listings" && (
        <div className="space-y-4">
          {pendingListings.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12">
              <EmptyState icon={Home} title="No pending listings" description="All listings reviewed" />
            </div>
          ) : pendingListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 h-32 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {listing.images?.[0]?.url ? <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-gray-400" /></div>}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{listing.title}</h3>
                  <p className="text-sm text-gray-600">{listing.location || "No location"}</p>
                  <p className="text-sm text-gray-700 line-clamp-2 mt-2">{listing.description || "No description"}</p>
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>Host: {listing.host?.name || "Unknown"}</span>
                    <span>${listing.hourlyRate}/hr</span>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  <ActionButton icon={Check} label="Approve" variant="success" onClick={() => handleApproveListing(listing.id)} />
                  <ActionButton icon={X} label="Reject" variant="danger" onClick={() => handleRejectListing(listing.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "reviews" && (
        <div className="space-y-4">
          {pendingReviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12">
              <EmptyState icon={Star} title="No pending reviews" description="All reviews moderated" />
            </div>
          ) : pendingReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">{review.user?.name?.charAt(0) || "U"}</span>
                    </div>
                    <div>
                      <p className="font-medium">{review.user?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">For: {review.listing?.title || "Unknown"}</p>
                  <p className="text-gray-700">{review.comment || "No comment"}</p>
                </div>
                <div className="flex md:flex-col gap-2">
                  <ActionButton icon={Check} label="Approve" variant="success" onClick={() => handleApproveReview(review.id)} />
                  <ActionButton icon={X} label="Reject" variant="danger" onClick={() => handleRejectReview(review.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}