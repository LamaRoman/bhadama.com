"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import { StatusBadge, LoadingSpinner, EmptyState, ActionButton, StarRating, formatDate } from "../shared";
import { Star, Search, Check, X, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ReviewsTab() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

 const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await api(`/api/admin/reviews?status=${statusFilter}&limit=100`);
    setReviews(Array.isArray(res) ? res : []);
  } catch (error) { toast.error("Failed to load reviews"); }
  finally { setLoading(false); }
}, [statusFilter]);  // Add statusFilter as dependency

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (statusFilter === "all" || r.status === statusFilter);
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <LoadingSpinner message="Loading reviews..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reviews Moderation</h2>
          <p className="text-gray-600">Approve or reject user reviews</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {reviews.filter(r => r.status === "PENDING").length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-yellow-800">
              {reviews.filter(r => r.status === "PENDING").length} Pending Reviews
            </h3>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {paginatedReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12">
            <EmptyState icon={Star} title="No reviews found" description="No reviews match your criteria" />
          </div>
        ) : paginatedReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold">{review.user?.name?.charAt(0) || "U"}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StarRating rating={review.rating || 0} />
                    <span className="text-sm font-medium">{review.rating}/5</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">For: <span className="font-medium">{review.listing?.title || "Unknown"}</span></p>
                <p className="text-gray-700">{review.comment || "No comment"}</p>
                <div className="mt-3"><StatusBadge status={review.status} /></div>
              </div>
              <div className="flex flex-row md:flex-col gap-2">
                <ActionButton icon={Eye} label="View" onClick={() => window.open(`/listings/${review.listingId}`, '_blank')} />
                {review.status === "PENDING" && (
                  <>
                    <ActionButton icon={Check} label="Approve" variant="success" onClick={() => handleApproveReview(review.id)} />
                    <ActionButton icon={X} label="Reject" variant="danger" onClick={() => handleRejectReview(review.id)} />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Previous</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}