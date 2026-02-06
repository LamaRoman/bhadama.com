"use client";

import { useState } from "react";
import StarRating from "./StarRating";

export default function ReviewItem({ review }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {review.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {review.user?.name || "Anonymous"}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <StarRating rating={review.rating} />
            <span className="text-lg font-bold text-gray-900 ml-2">
              {review.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="text-lg font-bold text-gray-900 mb-2">{review.title}</h4>
      )}

      <p className={`text-gray-700 ${!expanded && review.comment?.length > 300 ? "line-clamp-3" : ""}`}>
        {review.comment}
      </p>

      {review.comment?.length > 300 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mt-2"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Host Response */}
      {review.hostResponse && (
        <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-emerald-800">Host Response</span>
                {review.respondedAt && (
                  <span className="text-xs text-emerald-600">
                    • {new Date(review.respondedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <p className="text-emerald-900 text-sm leading-relaxed">{review.hostResponse}</p>
            </div>
          </div>
        </div>
      )}

      {review.bookingDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Stayed on {new Date(review.bookingDetails.bookingDate).toLocaleDateString()}
            {review.bookingDetails.guests > 1 && ` • ${review.bookingDetails.guests} guests`}
          </p>
        </div>
      )}
    </div>
  );
}