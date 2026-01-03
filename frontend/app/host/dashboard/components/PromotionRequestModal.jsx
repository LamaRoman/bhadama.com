"use client";

import { useState, useEffect } from "react";
import { api } from "../../../utils/api.js";
import { toast } from "react-hot-toast";
import { 
  X, Star, Sparkles, Clock, CheckCircle, XCircle, 
  AlertCircle, Send, Info, TrendingUp, Calendar
} from "lucide-react";

export default function PromotionRequestModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [formData, setFormData] = useState({
    duration: 7,
    startDate: "",
    endDate: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && listing) {
      fetchExistingRequest();
      
      // Set default dates
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
      setFormData({
        duration: 7,
        startDate: today.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        message: "",
      });
      setErrors({});
    }
  }, [isOpen, listing]);

  const fetchExistingRequest = async () => {
    try {
      const data = await api(`/api/host/listings/${listing.id}/promotion-request`);
      setExistingRequest(data.request || null);
    } catch (error) {
      // No existing request
      setExistingRequest(null);
    }
  };

  if (!isOpen || !listing) return null;

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        newErrors.endDate = "Promotion period cannot exceed 30 days";
      }
      if (diffDays < 3) {
        newErrors.endDate = "Minimum promotion period is 3 days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update duration when dates change
  const updateDuration = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  // Apply preset duration
  const applyPresetDuration = (days) => {
    const startDate = formData.startDate || new Date().toISOString().split("T")[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    
    setFormData({
      ...formData,
      startDate,
      endDate: endDate.toISOString().split("T")[0],
      duration: days,
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const duration = updateDuration(formData.startDate, formData.endDate);
      
      await api(`/api/host/listings/${listing.id}/promotion-request`, {
        method: "POST",
        body: JSON.stringify({
          duration: duration,
          startDate: formData.startDate,
          endDate: formData.endDate,
          message: formData.message,
        }),
      });
      toast.success("Promotion request submitted!");
      fetchExistingRequest();
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your promotion request?")) return;
    
    setLoading(true);
    try {
      await api(`/api/host/listings/${listing.id}/promotion-request`, {
        method: "DELETE",
      });
      toast.success("Request cancelled");
      setExistingRequest(null);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to cancel request");
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyFeatured = listing.isFeatured && listing.featuredUntil && new Date(listing.featuredUntil) > new Date();
  const calculatedDuration = updateDuration(formData.startDate, formData.endDate);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-4 h-4" /> Pending Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Request Featured Listing</h2>
              <p className="text-sm text-gray-500">{listing.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Already Featured */}
          {isAlreadyFeatured && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 fill-green-600" />
              <div>
                <p className="font-medium text-green-800">Your listing is currently featured!</p>
                <p className="text-sm text-green-600">
                  Featured until {new Date(listing.featuredUntil).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Existing Request Status */}
          {existingRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Current Request</h3>
                  {getStatusBadge(existingRequest.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested Duration:</span>
                    <span className="font-medium">{existingRequest.duration} days</span>
                  </div>
                  {existingRequest.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-medium">
                        {new Date(existingRequest.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {existingRequest.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">End Date:</span>
                      <span className="font-medium">
                        {new Date(existingRequest.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium">
                      {new Date(existingRequest.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {existingRequest.message && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-500 mb-1">Your message:</p>
                      <p className="text-gray-700 italic">"{existingRequest.message}"</p>
                    </div>
                  )}
                  {existingRequest.adminNote && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-500 mb-1">Admin response:</p>
                      <p className="text-gray-700">"{existingRequest.adminNote}"</p>
                    </div>
                  )}
                </div>

                {existingRequest.status === "PENDING" && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="mt-4 w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          {!existingRequest && !isAlreadyFeatured && (
            <>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Benefits of Featured Listing</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: TrendingUp, text: "Higher visibility", color: "blue" },
                    { icon: Star, text: "Featured badge", color: "yellow" },
                    { icon: Sparkles, text: "Homepage placement", color: "purple" },
                    { icon: TrendingUp, text: "More bookings", color: "green" },
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <benefit.icon className={`w-5 h-5 text-${benefit.color}-500`} />
                      <span className="text-sm text-gray-700">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Submit a request to have your listing featured. You must specify a start and end date. Our team will review your listing based on quality, photos, reviews, and completeness.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick Duration Presets */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick select duration:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { days: 7, label: "1 week" },
                      { days: 14, label: "2 weeks" },
                      { days: 30, label: "1 month" },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => applyPresetDuration(preset.days)}
                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                          calculatedDuration === preset.days
                            ? "bg-amber-100 border-amber-300 text-amber-700"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date - REQUIRED */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value });
                        setErrors({ ...errors, startDate: undefined });
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        errors.startDate ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.startDate}
                    </p>
                  )}
                </div>

                {/* End Date - REQUIRED */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value });
                        setErrors({ ...errors, endDate: undefined });
                      }}
                      min={formData.startDate || new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        errors.endDate ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.endDate ? (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.endDate}
                    </p>
                  ) : calculatedDuration > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Promotion will run for {calculatedDuration} day{calculatedDuration > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why should your listing be featured? (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what makes your space special..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formData.message.length}/500
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </>
          )}

          {/* Already Featured - No action needed */}
          {isAlreadyFeatured && !existingRequest && (
            <div className="text-center py-4">
              <p className="text-gray-500">Your listing is already featured. No action needed!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}