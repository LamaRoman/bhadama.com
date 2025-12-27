"use client";

import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import ReviewItem from "./ReviewItem";

export default function ReviewsSection({
  reviews,
  reviewStats,
  listingId,
  user,
  canUserReview,
  userReview,
  eligibleBookingId,
}) {
  const router = useRouter();

  const handleLeaveReview = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/public/listings/${listingId}`);
      return;
    }
    router.push(`/reviews/new/${listingId}${eligibleBookingId ? `?bookingId=${eligibleBookingId}` : ""}`);
  };

  return (
    <div className="space-y-8">
      {/* Reviews Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2">
              {reviewStats.average.toFixed(1)} out of 5
            </h2>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={reviewStats.average} />
              <span className="text-stone-600">({reviewStats.total} reviews)</span>
            </div>
          </div>

          {/* Review Button - Only show if user can review */}
          <div className="flex flex-col items-end gap-2">
            {canUserReview && !userReview ? (
              <button
                onClick={handleLeaveReview}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                ✍️ Leave a Review
              </button>
            ) : userReview ? (
              <div className="px-6 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                ✅ You've reviewed this space
              </div>
            ) : !user ? (
              <button
                onClick={() => router.push(`/auth/login?redirect=/public/listings/${listingId}`)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                🔐 Login to Review
              </button>
            ) : null}
          </div>
        </div>

        {/* Rating Distribution */}
        {reviewStats.total > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-stone-900">Rating Breakdown</h4>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewStats.distribution[stars] || 0;
              const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-600 w-12">
                    {stars} {stars === 1 ? "star" : "stars"}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-stone-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-stone-900">
            Guest Reviews ({reviewStats.total})
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-stone-100">
          <div className="w-24 h-24 mx-auto mb-6 text-stone-200">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-stone-900 mb-2">No reviews yet</h3>
          <p className="text-stone-600 max-w-md mx-auto mb-6">
            Be the first to share your experience! Complete a booking to leave a review.
          </p>
        </div>
      )}
    </div>
  );
}