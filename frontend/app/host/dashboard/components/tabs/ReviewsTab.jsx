"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  Star, MessageSquare, TrendingUp, BarChart3, Home, X,
} from "lucide-react";

// Star Rating Component
function StarRating({ rating }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.floor(rating || 0)
              ? "text-yellow-500 fill-current"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// Calculate review stats
const calcReviewStats = (reviews) => {
  if (!reviews?.length) {
    return { totalReviews: 0, averageRating: 0, responseRate: 0, recentReviews: 0, positiveReviews: 0 };
  }
  const total = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const responded = reviews.filter(r => r.hostResponse).length;
  const positive = reviews.filter(r => r.rating >= 4).length;
  const weekAgo = Date.now() - 604800000;
  const recent = reviews.filter(r => new Date(r.createdAt) > weekAgo).length;
  return { totalReviews: total, averageRating: avg, responseRate: (responded / total) * 100 || 0, recentReviews: recent, positiveReviews: positive };
};

// Review Card Component
function ReviewCard({ review, onReply }) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
          {(review.guestName || "G").charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{review.guestName || "Guest"}</h4>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-sm text-gray-500">{(review.rating || 0).toFixed(1)}</span>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
        </div>
      </div>

      <p className="text-gray-700 mb-4">{review.comment || "No comment provided"}</p>

      {/* Host Response */}
      {review.hostResponse && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">Host Response</span>
              {review.respondedAt && (
                <span className="text-xs text-gray-500 ml-2">
                  • {new Date(review.respondedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-700 text-sm pl-10">{review.hostResponse}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
        <span className="text-sm text-gray-600">{review.listingTitle || "Listing"}</span>
        {review.hostResponse ? (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Responded
          </span>
        ) : (
          <button
            onClick={() => onReply(review)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" /> Reply
          </button>
        )}
      </div>
    </div>
  );
}

// Reply Modal Component
function ReplyModal({ review, onClose, onSubmit }) {
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(review.id, replyText);
      onClose();
    } catch (e) {
      toast.error("Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Reply to {review.guestName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} />
            <span>{(review.rating || 0).toFixed(1)}</span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>

        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Your response..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Response"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsTab({ refreshKey }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [refreshKey]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api("/api/host/reviews");
      const mappedReviews = (data.reviews || []).map(r => ({
        id: r.id,
        guestName: r.user?.name || r.guestName || "Guest",
        listingTitle: r.listing?.title || r.listingTitle || "Listing",
        rating: r.rating || 0,
        comment: r.comment || r.text || "",
        createdAt: r.createdAt,
        hostResponse: r.hostResponse || r.response || null,
        respondedAt: r.respondedAt,
      }));
      setReviews(mappedReviews);
    } catch (e) {
      console.error("Failed to fetch reviews:", e);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const reviewStats = useMemo(() => calcReviewStats(reviews), [reviews]);

  const handleReply = async (reviewId, response) => {
    await api(`/api/host/reviews/${reviewId}/reply`, {
      method: "POST",
      body: { response },
    });

    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, hostResponse: response, respondedAt: new Date().toISOString() }
          : r
      )
    );

    toast.success("Response sent successfully! 🎉");
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Average Rating",
      value: (reviewStats.averageRating || 0).toFixed(1),
      icon: Star,
      bg: "from-blue-50 to-blue-100 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Response Rate",
      value: `${(reviewStats.responseRate || 0).toFixed(0)}%`,
      icon: MessageSquare,
      bg: "from-green-50 to-green-100 border-green-200",
      iconColor: "text-green-600",
    },
    {
      label: "Recent Reviews",
      value: reviewStats.recentReviews || 0,
      icon: TrendingUp,
      bg: "from-amber-50 to-amber-100 border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      label: "Positive",
      value: `${reviewStats.positiveReviews || 0}/${reviewStats.totalReviews || 0}`,
      icon: BarChart3,
      bg: "from-purple-50 to-purple-100 border-purple-200",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, bg, iconColor }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} rounded-xl p-5 border`}>
            <div className="flex items-center justify-between mb-4">
              <Icon className={`w-8 h-8 ${iconColor}`} />
              <span className="text-2xl font-bold text-gray-900">{value}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
          </div>
        ))}
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">All Reviews</h3>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(r => (
              <ReviewCard key={r.id} review={r} onReply={setSelectedReview} />
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <ReplyModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onSubmit={handleReply}
        />
      )}
    </div>
  );
}