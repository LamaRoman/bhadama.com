"use client";

import { useState, useEffect } from "react";
import { api } from "../../../utils/api.js";
import { toast } from "react-hot-toast";
import { X, Calendar, Plus, Trash2, Ban, Info, CalendarX } from "lucide-react";

export default function BlockDatesModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen && listing) {
      fetchBlockedDates();
    }
  }, [isOpen, listing]);

  const fetchBlockedDates = async () => {
    try {
      const data = await api(`/api/host/listings/${listing.id}/blocked-dates`);
      setBlockedDates(data.blockedDates || []);
    } catch (error) {
      console.error("Failed to fetch blocked dates:", error);
      setBlockedDates([]);
    }
  };

  if (!isOpen || !listing) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.startDate) {
      toast.error("Please select a start date");
      return;
    }

    setLoading(true);
    try {
      await api(`/api/host/listings/${listing.id}/block-dates`, {
        method: "POST",
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate || formData.startDate,
          reason: formData.reason || "Blocked by host",
        }),
      });
      toast.success("Dates blocked!");
      setFormData({ startDate: "", endDate: "", reason: "" });
      setShowAddForm(false);
      fetchBlockedDates();
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to block dates");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (blockId) => {
    if (!confirm("Unblock these dates?")) return;
    
    try {
      await api(`/api/host/listings/${listing.id}/block-dates/${blockId}`, {
        method: "DELETE",
      });
      toast.success("Dates unblocked");
      fetchBlockedDates();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to unblock");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (start, end) => {
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    if (startDate === endDate) return startDate;
    return `${startDate} - ${endDate}`;
  };

  const getDayCount = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Block Dates</h2>
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
          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">
              Block dates when your space is unavailable for bookings (maintenance, personal use, holidays, etc.). Guests won't be able to book during these periods.
            </p>
          </div>

          {/* Existing Blocked Dates */}
          {blockedDates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Blocked Periods</h3>
              {blockedDates.map((block) => {
                const days = getDayCount(block.startDate, block.endDate);
                
                return (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center">
                        <Ban className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDateRange(block.startDate, block.endDate)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{days} day{days > 1 ? "s" : ""}</span>
                          {block.reason && (
                            <>
                              <span>•</span>
                              <span>{block.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(block.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Unblock dates"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {blockedDates.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No dates blocked</p>
              <p className="text-sm text-gray-400">Your listing is available for all dates</p>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="space-y-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <h3 className="font-medium text-gray-900">Block Date Range</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for single day</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Maintenance, Personal Use"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Quick Reasons */}
              <div className="flex flex-wrap gap-2">
                {["Maintenance", "Personal Use", "Renovation", "Holiday", "Private Event", "Other"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFormData({ ...formData, reason })}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      formData.reason === reason
                        ? "bg-orange-100 border-orange-300 text-orange-700"
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
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? "Blocking..." : "Block Dates"}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Block Dates
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Select dates above to block them
            </p>
          )}
        </div>
      </div>
    </div>
  );
}