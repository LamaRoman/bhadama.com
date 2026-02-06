"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../utils/api.js";
import { toast } from "react-hot-toast";
import { X, Percent, Calendar, Tag, Trash2, Save, AlertCircle } from "lucide-react";

export default function DiscountModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    discountPercent: 0,
    discountFrom: "",
    discountUntil: "",
    discountReason: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (listing) {
      const today = new Date().toISOString().split("T")[0];
      // Default end date: 7 days from start
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 7);
      
      setFormData({
        discountPercent: listing.discountPercent || 0,
        discountFrom: listing.discountFrom 
          ? new Date(listing.discountFrom).toISOString().split("T")[0] 
          : today,
        discountUntil: listing.discountUntil 
          ? new Date(listing.discountUntil).toISOString().split("T")[0] 
          : defaultEndDate.toISOString().split("T")[0],
        discountReason: listing.discountReason || "",
      });
      setErrors({});
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const hasDiscount = listing.discountPercent > 0;

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.discountPercent || formData.discountPercent < 1) {
      newErrors.discountPercent = "Discount percentage is required (min 1%)";
    }
    if (formData.discountPercent > 90) {
      newErrors.discountPercent = "Discount cannot exceed 90%";
    }
    if (!formData.discountFrom) {
      newErrors.discountFrom = "Start date is required";
    }
    if (!formData.discountUntil) {
      newErrors.discountUntil = "End date is required";
    }
    if (formData.discountFrom && formData.discountUntil) {
      const from = new Date(formData.discountFrom);
      const until = new Date(formData.discountUntil);
      if (until <= from) {
        newErrors.discountUntil = "End date must be after start date";
      }
      // Max duration: 90 days
      const diffDays = Math.ceil((until - from) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        newErrors.discountUntil = "Discount period cannot exceed 90 days";
      }
    }
    if (!formData.discountReason || formData.discountReason.trim().length < 3) {
      newErrors.discountReason = "Please provide a discount label (min 3 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setLoading(true);

    try {
      const endpoint = `/api/host/listings/${listing.id}/discount`;
      const method = hasDiscount ? "PUT" : "POST";

      await api(endpoint, {
        method,
        body: {
          discountPercent: parseInt(formData.discountPercent),
          discountFrom: formData.discountFrom,
          discountUntil: formData.discountUntil,
          discountReason: formData.discountReason.trim(),
        },
      });

      toast.success(hasDiscount ? "Discount updated!" : "Discount added!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Discount error:", error);
      toast.error(error.message || "Failed to save discount");
    } finally {
      setLoading(false);
    }
  };

 const handleRemoveDiscount = async () => {
  if (!confirm("Are you sure you want to remove the discount?")) return;

  setLoading(true);
  try {
    const endpoint = `/api/host/listings/${listing.id}/discount`;

    await api(endpoint, {
      method: "DELETE",
    });

    toast.success("Discount removed successfully!");
    onUpdate?.();
    onClose();
  } catch (error) {
    console.error("Remove discount error:", error);

    // Better error handling
    if (error.message?.includes("404")) {
      toast.error("Listing not found or you are not authorized");
    } else if (error.message?.includes("Failed")) {
      toast.error("Failed to remove discount");
    } else {
      toast.error(error.message || "Something went wrong");
    }
  } finally {
    setLoading(false);
  }
};


  const discountedPrice = listing.hourlyRate 
    ? (parseFloat(listing.hourlyRate) * (1 - formData.discountPercent / 100)).toFixed(2)
    : 0;

  // Calculate duration
  const getDuration = () => {
    if (!formData.discountFrom || !formData.discountUntil) return null;
    const from = new Date(formData.discountFrom);
    const until = new Date(formData.discountUntil);
    const diffDays = Math.ceil((until - from) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const duration = getDuration();

  // Quick duration presets
  const applyQuickDuration = (days) => {
    const startDate = formData.discountFrom || new Date().toISOString().split("T")[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    setFormData({
      ...formData,
      discountFrom: startDate,
      discountUntil: endDate.toISOString().split("T")[0],
    });
    setErrors({ ...errors, discountUntil: undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {hasDiscount ? "Edit Sale Discount" : "Add Sale Discount"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="1"
                max="90"
                value={formData.discountPercent}
                onChange={(e) => {
                  setFormData({ ...formData, discountPercent: e.target.value });
                  setErrors({ ...errors, discountPercent: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.discountPercent ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Enter discount %"
              />
            </div>
            {errors.discountPercent ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.discountPercent}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Between 1% and 90%</p>
            )}
          </div>

          {/* Preview */}
          {formData.discountPercent > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Original Price</p>
                  <p className="text-lg text-gray-400 line-through">
                    Rs.{listing.hourlyRate}/hr
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">
                    {formData.discountPercent}% OFF
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    Rs.{discountedPrice}/hr
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Discount Label - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Label <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.discountReason}
                onChange={(e) => {
                  setFormData({ ...formData, discountReason: e.target.value });
                  setErrors({ ...errors, discountReason: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.discountReason ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="e.g., New Year Sale, Weekend Special"
                maxLength={50}
              />
            </div>
            {errors.discountReason ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.discountReason}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">This will be shown to customers</p>
            )}
          </div>

          {/* Quick Labels */}
          <div className="flex flex-wrap gap-2">
            {["New Year Sale", "Holiday Special", "Weekend Deal", "Flash Sale", "Early Bird", "Last Minute"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, discountReason: label });
                  setErrors({ ...errors, discountReason: undefined });
                }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  formData.discountReason === label
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Valid From - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.discountFrom}
                onChange={(e) => {
                  setFormData({ ...formData, discountFrom: e.target.value });
                  setErrors({ ...errors, discountFrom: undefined });
                }}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  errors.discountFrom ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>
            {errors.discountFrom && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.discountFrom}
              </p>
            )}
          </div>

          {/* Valid Until - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.discountUntil}
                onChange={(e) => {
                  setFormData({ ...formData, discountUntil: e.target.value });
                  setErrors({ ...errors, discountUntil: undefined });
                }}
                min={formData.discountFrom || new Date().toISOString().split("T")[0]}
                className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  errors.discountUntil ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>
            {errors.discountUntil ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.discountUntil}
              </p>
            ) : duration && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Discount will run for {duration} day{duration > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Quick Duration Presets */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Quick duration:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { days: 3, label: "3 days" },
                { days: 7, label: "1 week" },
                { days: 14, label: "2 weeks" },
                { days: 30, label: "1 month" },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyQuickDuration(preset.days)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    duration === preset.days
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            {hasDiscount && (
              <button
                type="button"
                onClick={handleRemoveDiscount}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : hasDiscount ? "Update Discount" : "Add Discount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}