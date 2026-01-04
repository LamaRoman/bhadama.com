"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../utils/api.js";
import { toast } from "react-hot-toast";
import { X, Calendar, DollarSign, Plus, Trash2, Tag, Info } from "lucide-react";

export default function SpecialPricingModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [specialPrices, setSpecialPrices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    hourlyRate: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen && listing) {
      fetchSpecialPricing();
    }
  }, [isOpen, listing]);

  const fetchSpecialPricing = async () => {
    try {
      const data = await api(`/api/host/listings/${listing.id}/special-pricing`);
      setSpecialPrices(data.specialPricing || []);
    } catch (error) {
      console.error("Failed to fetch special pricing:", error);
      setSpecialPrices([]);
    }
  };

  if (!isOpen || !listing) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.hourlyRate) {
      toast.error("Please fill date and rate");
      return;
    }

    setLoading(true);
    try {
      await api(`/api/host/listings/${listing.id}/special-pricing`, {
        method: "POST",
        body: formData,
      });
      toast.success("Special pricing added!");
      setFormData({ date: "", hourlyRate: "", reason: "" });
      setShowAddForm(false);
      fetchSpecialPricing();
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to add special pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (pricingId) => {
    if (!confirm("Remove this special pricing?")) return;
    
    try {
      await api(`/api/host/listings/${listing.id}/special-pricing/${pricingId}`, {
        method: "DELETE",
      });
      toast.success("Special pricing removed");
      fetchSpecialPricing();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const baseRate = parseFloat(listing.hourlyRate) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Special Date Pricing</h2>
            <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Base Rate Info */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Standard Rate</p>
              <p className="text-xl font-bold text-gray-900">Rs.{baseRate}/hr</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Set custom rates for holidays, weekends, or peak seasons. These rates override your standard hourly rate for specific dates.
            </p>
          </div>

          {/* Existing Special Prices */}
          {specialPrices.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Active Special Pricing</h3>
              {specialPrices.map((sp) => {
                const rate = parseFloat(sp.hourlyRate);
                const diff = rate - baseRate;
                const isHigher = diff > 0;
                
                return (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(sp.date)}</p>
                        {sp.reason && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {sp.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">Rs.{rate}/hr</p>
                        <p className={`text-xs ${isHigher ? "text-red-500" : "text-green-500"}`}>
                          {isHigher ? "+" : ""}{diff.toFixed(0)} from base
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(sp.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {specialPrices.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No special pricing set</p>
              <p className="text-sm text-gray-400">Add custom rates for specific dates</p>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="space-y-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <h3 className="font-medium text-gray-900">Add Special Price</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (Rs./hr)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    min="1"
                    step="0.01"
                    placeholder={baseRate.toString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Holiday, Weekend, Peak Season"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Reasons */}
              <div className="flex flex-wrap gap-2">
                {["Holiday", "Weekend", "Peak Season", "Special Event", "Off-Peak"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFormData({ ...formData, reason })}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      formData.reason === reason
                        ? "bg-purple-100 border-purple-300 text-purple-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Price"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Special Price
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Fill the form above to add a special price
            </p>
          )}
        </div>
      </div>
    </div>
  );
}