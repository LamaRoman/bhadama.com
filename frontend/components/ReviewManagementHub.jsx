"use client";

import { useState } from "react";
import { Star, Filter, Search, MessageSquare, CheckCircle, XCircle, ChevronDown, Building } from "lucide-react";

export default function ReviewManagementHub({ reviews, reviewStats, onReply, listings }) {
  const [selectedListing, setSelectedListing] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const filteredReviews = reviews.filter(review => {
    if (selectedListing !== "all" && review.listingId !== selectedListing) return false;
    if (selectedRating !== "all" && review.rating !== parseInt(selectedRating)) return false;
    if (searchQuery && !review.comment.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSubmitReply = (reviewId) => {
    if (replyText.trim()) {
      onReply(reviewId, replyText);
      setReplyingTo(null);
      setReplyText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {reviewStats.averageRating}
                </span>
                <span className="text-gray-500">/5</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(reviewStats.averageRating / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviewStats.totalReviews}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Last 30 days: +{reviewStats.monthlyTrend}%
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviewStats.responseRate}%
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {reviewStats.pendingReplies} pending replies
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-2xl border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">5-Star Reviews</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviewStats.fiveStarReviews}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {Math.round((reviewStats.fiveStarReviews / reviewStats.totalReviews) * 100)}% of total
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value)}
            >
              <option value="all">All Listings</option>
              {listings.map(listing => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </option>
              ))}
            </select>

            <button className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{review.guestName}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`/host/listings/${review.listingId}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {review.listingName}
                  </a>
                </div>
              </div>
              {!review.hasReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Reply
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            {/* Reply Section */}
            {review.hasReply && review.reply && (
              <div className="ml-6 pl-4 border-l-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">Your Response</span>
                  <span className="text-sm text-gray-500">
                    • {new Date(review.replyDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.reply}</p>
              </div>
            )}

            {/* Reply Form */}
            {replyingTo === review.id && (
              <div className="mt-4 ml-6 pl-4 border-l-2 border-blue-200">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitReply(review.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}