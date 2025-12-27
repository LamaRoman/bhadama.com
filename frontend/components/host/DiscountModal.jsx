"use client";

import { useState } from "react";
import { api } from "../../utils/api.js";
import { toast } from "react-hot-toast";

export default function DiscountModal({ listing, onClose, onSuccess }) {
  const [discountPercent, setDiscountPercent] = useState(listing?.discountPercent || 0);
  const [discountReason, setDiscountReason] = useState(listing?.discountReason || "");
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const presetDiscounts = [10, 15, 20, 25, 30, 50];
  const presetReasons = [
    "🎉 Holiday Sale",
    "🆕 New Listing Special",
    "⚡ Flash Deal",
    "🌟 Weekend Offer",
    "📅 Last Minute Deal",
    "🎁 Special Promotion"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api(`/api/discover/host/discount/${listing.id}`, {
        method: "PUT",
        body: {
          discountPercent,
          discountReason,
          durationDays: durationDays || null
        }
      });

      toast.success(
        discountPercent > 0 
          ? `${discountPercent}% discount applied!` 
          : "Discount removed"
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to update discount");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setLoading(true);
    try {
      await api(`/api/discover/host/discount/${listing.id}`, {
        method: "PUT",
        body: {
          discountPercent: 0,
          discountReason: null,
          durationDays: null
        }
      });
      toast.success("Discount removed");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to remove discount");
    } finally {
      setLoading(false);
    }
  };

  const originalPrice = Number(listing?.hourlyRate || 0);
  const discountedPrice = originalPrice * (1 - discountPercent / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Set Discount</h3>
              <p className="text-gray-600 text-sm mt-1">{listing?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Price Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Original Price</span>
              <span className="text-gray-900 font-medium">${originalPrice}/hr</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Discount</span>
              <span className="text-red-600 font-medium">-{discountPercent}%</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-bold">Final Price</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${discountedPrice.toFixed(2)}/hr
                </span>
              </div>
            </div>
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetDiscounts.map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setDiscountPercent(percent)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    discountPercent === percent
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium text-red-600">{discountPercent}%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Discount Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Reason (Badge Text)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDiscountReason(reason)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    discountReason === reason
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Custom reason (e.g., Summer Special)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { days: 3, label: "3 days" },
                { days: 7, label: "1 week" },
                { days: 14, label: "2 weeks" },
                { days: 30, label: "1 month" }
              ].map(({ days, label }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    durationDays === days
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDurationDays(null)}
              className={`mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                durationDays === null
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              No Expiry (Until manually removed)
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {listing?.discountPercent > 0 && (
              <button
                type="button"
                onClick={handleRemoveDiscount}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Remove Discount
              </button>
            )}
            <button
              type="submit"
              disabled={loading || discountPercent === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Apply Discount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}