// app/components/ReviewFormModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api.js";
import { toast } from "react-hot-toast";

export default function ReviewFormModal({
  listing,
  user,
  userReview,
  bookingId,
  showReviewForm,
  setShowReviewForm,
  onReviewSubmitted,
}) {
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
    cleanliness: 5,
    accuracy: 5,
    communication: 5,
    location: 5,
    checkin: 5,
    value: 5,
  });
  const reviewFormRef = useRef(null);

  // Initialize form with existing review data if editing
  useEffect(() => {
    if (userReview) {
      setReviewForm({
        rating: userReview.rating || 0,
        title: userReview.title || "",
        comment: userReview.comment || "",
        cleanliness: userReview.cleanliness || 5,
        accuracy: userReview.accuracy || 5,
        communication: userReview.communication || 5,
        location: userReview.location || 5,
        checkin: userReview.checkin || 5,
        value: userReview.value || 5,
      });
    } else {
      // Reset form for new review
      setReviewForm({
        rating: 0,
        title: "",
        comment: "",
        cleanliness: 5,
        accuracy: 5,
        communication: 5,
        location: 5,
        checkin: 5,
        value: 5,
      });
    }
  }, [userReview, showReviewForm]);

  // Close modal when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        reviewFormRef.current &&
        !reviewFormRef.current.contains(e.target) &&
        showReviewForm
      ) {
        closeModal();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReviewForm]);

  const closeModal = () => {
    setShowReviewForm(false);
    if (!userReview) {
      setReviewForm({
        rating: 0,
        title: "",
        comment: "",
        cleanliness: 5,
        accuracy: 5,
        communication: 5,
        location: 5,
        checkin: 5,
        value: 5,
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (reviewForm.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error("Please listingpage comment");
      return;
    }

    setSubmittingReview(true);

    try {
      const endpoint = userReview
        ? `/api/reviews/${userReview.id}`
        : `/api/reviews/${listing.id}`;

      const method = userReview ? "PUT" : "POST";

      const reviewData = {
        listingId: listing.id,
        userId: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        title: reviewForm.title || null,
        cleanliness: reviewForm.cleanliness,
        accuracy: reviewForm.accuracy,
        communication: reviewForm.communication,
        location: reviewForm.location,
        checkin: reviewForm.checkin,
        value: reviewForm.value,
        bookingId:userReview?.bookingId||bookingId,
      };

      // Add bookingId if we have it (you might want to pass this as a prop)
      if (userReview?.bookingId) {
        reviewData.bookingId = userReview.bookingId;
      }

      const response = await api(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: reviewData,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(
        userReview ? "Review updated successfully!" : "Review submitted!",
        {
          duration: 3000,
          icon: "🎉",
        }
      );

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response);
      }

      closeModal();
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(error.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!showReviewForm) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div
          ref={reviewFormRef}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-stone-900">
                  {userReview ? "Edit Your Review" : "listingpage"}
                </h3>
                <p className="text-stone-600 mt-1">
                  Share your experience to help others decide
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-lg font-bold text-stone-900 mb-3">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((prev) => ({ ...prev, rating: star }))
                      }
                      className="text-5xl focus:outline-none hover:scale-110 transition-transform duration-150"
                    >
                      <span
                        className={
                          star <= reviewForm.rating
                            ? "text-yellow-400"
                            : "text-stone-300"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-2xl font-bold text-stone-700 ml-4">
                    {reviewForm.rating}.0
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-2">
                  How would you rate your overall experience?
                </p>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Summarize your experience in a few words"
                  className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  maxLength={100}
                />
                <div className="text-right text-sm text-stone-500 mt-1">
                  {reviewForm.title.length}/100 characters
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Share details about your experience, what you liked, and what could be improved..."
                  className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none h-40"
                  maxLength={2000}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-stone-500">
                    Be specific and helpful for other guests
                  </p>
                  <div className="text-sm text-stone-500">
                    {reviewForm.comment.length}/2000 characters
                  </div>
                </div>
              </div>

              {/* Category Ratings (Optional - can be collapsed) */}
              <div className="border-t border-stone-200 pt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-lg font-bold text-stone-900">
                      Category Ratings (Optional)
                    </span>
                    <svg
                      className="w-5 h-5 text-stone-500 group-open:rotate-180 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: "cleanliness", label: "Cleanliness" },
                      { key: "accuracy", label: "Accuracy" },
                      { key: "communication", label: "Communication" },
                      { key: "location", label: "Location" },
                      { key: "checkin", label: "Check-in" },
                      { key: "value", label: "Value" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-stone-700">
                            {label}
                          </label>
                          <span className="text-sm font-bold text-stone-900">
                            {reviewForm[key]}/5
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setReviewForm((prev) => ({
                                  ...prev,
                                  [key]: star,
                                }))
                              }
                              className="text-2xl focus:outline-none hover:scale-110 transition-transform"
                            >
                              <span
                                className={
                                  star <= reviewForm[key]
                                    ? "text-yellow-400"
                                    : "text-stone-300"
                                }
                              >
                                ★
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              {/* Bottom spacing for better scroll feel */}
              <div className="h-6"></div>
            </div>
          </div>

          {/* Footer with Actions - Fixed at bottom */}
          <div className="p-6 border-t border-stone-200 bg-stone-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 border border-stone-300 text-stone-700 font-bold rounded-lg hover:bg-stone-100 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={
                  submittingReview ||
                  reviewForm.rating === 0 ||
                  !reviewForm.comment.trim()
                }
                className={`px-6 py-3 font-bold rounded-lg transition-all flex-1 ${
                  submittingReview ||
                  reviewForm.rating === 0 ||
                  !reviewForm.comment.trim()
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg"
                }`}
              >
                {submittingReview ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : userReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}