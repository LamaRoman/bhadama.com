"use client";

import { useState, useEffect } from "react";
import { api } from "../../../utils/api.js";
import { toast } from "react-hot-toast";
import { X, Clock, Calendar, Zap, Settings, Save, Info } from "lucide-react";

export default function BookingSettingsModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    minAdvanceBooking: 24,
    maxAdvanceBooking: 90,
    minHours: 1,
    maxHours: 12,
    autoConfirm: false,
    instantBooking: true,
  });

  useEffect(() => {
    if (listing) {
      setFormData({
        minAdvanceBooking: listing.minAdvanceBooking || 24,
        maxAdvanceBooking: listing.maxAdvanceBooking || 90,
        minHours: listing.minHours || 1,
        maxHours: listing.maxHours || 12,
        autoConfirm: listing.autoConfirm || false,
        instantBooking: listing.instantBooking !== false,
      });
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api(`/api/host/listings/${listing.id}/booking-settings`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      toast.success("Booking settings updated!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Settings error:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Booking Settings</h2>
              <p className="text-sm text-gray-500">{listing.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Advance Booking Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Advance Booking
            </h3>

            {/* Minimum Advance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Notice Required
              </label>
              <select
                value={formData.minAdvanceBooking}
                onChange={(e) => setFormData({ ...formData, minAdvanceBooking: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 hour before</option>
                <option value={2}>2 hours before</option>
                <option value={6}>6 hours before</option>
                <option value={12}>12 hours before</option>
                <option value={24}>24 hours before (1 day)</option>
                <option value={48}>48 hours before (2 days)</option>
                <option value={72}>72 hours before (3 days)</option>
                <option value={168}>1 week before</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Guests must book at least this much time in advance
              </p>
            </div>

            {/* Maximum Advance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How Far in Advance Can Guests Book?
              </label>
              <select
                value={formData.maxAdvanceBooking}
                onChange={(e) => setFormData({ ...formData, maxAdvanceBooking: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={7}>1 week ahead</option>
                <option value={14}>2 weeks ahead</option>
                <option value={30}>1 month ahead</option>
                <option value={60}>2 months ahead</option>
                <option value={90}>3 months ahead</option>
                <option value={180}>6 months ahead</option>
                <option value={365}>1 year ahead</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of days in advance guests can book
              </p>
            </div>
          </div>

          {/* Duration Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking Duration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Minimum Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Hours
                </label>
                <select
                  value={formData.minHours}
                  onChange={(e) => setFormData({ ...formData, minHours: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                    <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Maximum Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Hours
                </label>
                <select
                  value={formData.maxHours}
                  onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[4, 6, 8, 10, 12, 16, 20, 24].map(h => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Instant Booking Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Booking Preferences
            </h3>

            {/* Instant Booking Toggle */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Instant Booking</p>
                  <p className="text-sm text-gray-500">Guests can book immediately without approval</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.instantBooking}
                  onChange={(e) => setFormData({ ...formData, instantBooking: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            {/* Auto Confirm Toggle */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Auto-Confirm Bookings</p>
                  <p className="text-sm text-gray-500">Automatically confirm all valid bookings</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.autoConfirm}
                  onChange={(e) => setFormData({ ...formData, autoConfirm: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How these settings work:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Minimum notice prevents last-minute bookings</li>
                <li>Maximum advance limits how far ahead guests can book</li>
                <li>Auto-confirm reduces your workload but gives less control</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}