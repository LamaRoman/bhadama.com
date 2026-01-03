"use client";

import { useState, useEffect } from "react";
import { api } from "../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  X, Clock, Percent, Plus, Trash2, Save, Gift,
  Info, TrendingUp, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";

// Default tier templates for quick setup
const TIER_TEMPLATES = {
  standard: [
    { minHours: 4, discountPercent: 10 },
    { minHours: 6, discountPercent: 15 },
    { minHours: 8, discountPercent: 20 },
  ],
  aggressive: [
    { minHours: 3, discountPercent: 10 },
    { minHours: 5, discountPercent: 20 },
    { minHours: 8, discountPercent: 30 },
  ],
  conservative: [
    { minHours: 4, discountPercent: 5 },
    { minHours: 6, discountPercent: 10 },
    { minHours: 10, discountPercent: 15 },
  ],
};

export default function DurationDiscountsModal({ listing, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tiers"); // "tiers" or "bonus"
  const [showTemplates, setShowTemplates] = useState(false);

  // Duration discount tiers
  const [tiers, setTiers] = useState([]);

  // Bonus hours offer
  const [bonusOffer, setBonusOffer] = useState({
    enabled: false,
    minHours: 4,
    bonusHours: 1,
    label: "Book 4+ hours, get 1 hour FREE!",
  });

  // Load existing data when modal opens
  useEffect(() => {
    if (listing && isOpen) {
      // Load duration discounts - handle the nested { tiers: [...] } structure from backend
      if (listing.durationDiscounts) {
        // Backend returns { tiers: [...] } structure
        const tiersData = listing.durationDiscounts.tiers || listing.durationDiscounts;
        if (Array.isArray(tiersData)) {
          setTiers(tiersData);
        } else {
          setTiers([]);
        }
      } else {
        setTiers([]);
      }

      // Load bonus offer
      if (listing.bonusHoursOffer && listing.bonusHoursOffer.minHours) {
        setBonusOffer({
          enabled: true,
          minHours: listing.bonusHoursOffer.minHours || 4,
          bonusHours: listing.bonusHoursOffer.bonusHours || 1,
          label: listing.bonusHoursOffer.label || "",
        });
      } else {
        setBonusOffer({
          enabled: false,
          minHours: 4,
          bonusHours: 1,
          label: "",
        });
      }
    }
  }, [listing, isOpen]);

  if (!isOpen || !listing) return null;

  const baseRate = parseFloat(listing.hourlyRate) || 0;

  // Add a new tier
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinHours = lastTier ? lastTier.minHours + 2 : 4;
    const newDiscount = lastTier ? Math.min(lastTier.discountPercent + 5, 50) : 10;

    setTiers([...tiers, { minHours: newMinHours, discountPercent: newDiscount }]);
  };

  // Update a tier
  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: parseInt(value) || 0 };
    setTiers(newTiers);
  };

  // Remove a tier
  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Apply a template
  const applyTemplate = (templateKey) => {
    setTiers([...TIER_TEMPLATES[templateKey]]);
    setShowTemplates(false);
    toast.success("Template applied!");
  };

  // Calculate discounted price for preview
  const getDiscountedPrice = (discountPercent) => {
    return (baseRate * (1 - discountPercent / 100)).toFixed(2);
  };

  // Calculate savings for a tier
  const calculateSavings = (minHours, discountPercent) => {
    const fullPrice = baseRate * minHours;
    const discountedPrice = fullPrice * (1 - discountPercent / 100);
    return (fullPrice - discountedPrice).toFixed(0);
  };

  // Validate tiers before saving
  const validateTiers = () => {
    if (tiers.length === 0) return true;

    // Check for valid values
    for (const tier of tiers) {
      if (tier.minHours < 1 || tier.minHours > 24) {
        toast.error("Hours must be between 1 and 24");
        return false;
      }
      if (tier.discountPercent < 1 || tier.discountPercent > 50) {
        toast.error("Discount must be between 1% and 50%");
        return false;
      }
    }

    // Check for duplicate hours
    const hours = tiers.map((t) => t.minHours);
    if (new Set(hours).size !== hours.length) {
      toast.error("Each tier must have unique hours");
      return false;
    }

    return true;
  };

  // Save all changes
  const handleSave = async () => {
    if (!validateTiers()) return;

    setLoading(true);
    try {
      // Format payload to match backend expectation:
      // durationDiscounts: { tiers: [...] }
      // bonusHoursOffer: { minHours, bonusHours, label }
      const sortedTiers = tiers.length > 0 
        ? [...tiers].sort((a, b) => a.minHours - b.minHours)
        : [];

      const payload = {
        durationDiscounts: sortedTiers.length > 0 
          ? { tiers: sortedTiers }
          : null,
        bonusHoursOffer: bonusOffer.enabled
          ? {
              minHours: bonusOffer.minHours,
              bonusHours: bonusOffer.bonusHours,
              label: bonusOffer.label || `Book ${bonusOffer.minHours}+ hours, get ${bonusOffer.bonusHours} hour${bonusOffer.bonusHours > 1 ? "s" : ""} FREE!`,
            }
          : null,
      };

      await api(`/api/host/listings/${listing.id}/duration-discounts`, {
        method: "PUT",
        body: payload,
      });

      toast.success("Discounts saved successfully!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save discounts");
    } finally {
      setLoading(false);
    }
  };

  // Clear all discounts
  const handleClearAll = async () => {
    if (!confirm("Remove all duration discounts and bonus offers?")) return;

    setLoading(true);
    try {
      await api(`/api/host/listings/${listing.id}/duration-discounts`, {
        method: "DELETE",
      });

      setTiers([]);
      setBonusOffer({ enabled: false, minHours: 4, bonusHours: 1, label: "" });
      toast.success("All discounts removed!");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to remove discounts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Duration Discounts & Offers
            </h2>
            <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "tiers"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Percent className="w-4 h-4" />
              Tiered Discounts
              {tiers.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                  {tiers.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("bonus")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "bonus"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-4 h-4" />
              Bonus Hours Offer
              {bonusOffer.enabled && (
                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                  Active
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "tiers" && (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How Tiered Discounts Work</p>
                  <p>
                    When a guest books for 4+ hours, they automatically get the matching discount tier.
                    Higher tiers override lower ones. For example, if they book 8 hours and you have
                    a 20% discount for 8+ hours, they get 20% off the entire booking.
                  </p>
                </div>
              </div>

              {/* Base Rate Display */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Hourly Rate</p>
                  <p className="text-2xl font-bold text-gray-900">Rs.{baseRate}/hr</p>
                </div>
                <Clock className="w-10 h-10 text-gray-300" />
              </div>

              {/* Templates Dropdown */}
              <div>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Use a template
                  {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTemplates && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <button
                      onClick={() => applyTemplate("standard")}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                    >
                      <p className="font-medium text-gray-900 text-sm">Standard</p>
                      <p className="text-xs text-gray-500 mt-1">10%, 15%, 20% off</p>
                    </button>
                    <button
                      onClick={() => applyTemplate("aggressive")}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left"
                    >
                      <p className="font-medium text-gray-900 text-sm">Aggressive</p>
                      <p className="text-xs text-gray-500 mt-1">10%, 20%, 30% off</p>
                    </button>
                    <button
                      onClick={() => applyTemplate("conservative")}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
                    >
                      <p className="font-medium text-gray-900 text-sm">Conservative</p>
                      <p className="text-xs text-gray-500 mt-1">5%, 10%, 15% off</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Tiers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Discount Tiers</h3>
                  {tiers.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {tiers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No duration discounts set</p>
                    <p className="text-sm text-gray-400">Add tiers to encourage longer bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tiers
                      .sort((a, b) => a.minHours - b.minHours)
                      .map((tier, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors"
                        >
                          {/* Hours Input */}
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Min Hours</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="24"
                                value={tier.minHours}
                                onChange={(e) => updateTier(index, "minHours", e.target.value)}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                              />
                              <span className="text-gray-500 text-sm">hours+</span>
                            </div>
                          </div>

                          {/* Discount Input */}
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Discount</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={tier.discountPercent}
                                onChange={(e) => updateTier(index, "discountPercent", e.target.value)}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                              />
                              <span className="text-gray-500 text-sm">% off</span>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="flex-1 text-right">
                            <p className="text-xs text-gray-500 mb-1">Effective Rate</p>
                            <p className="font-bold text-green-600">
                              Rs.{getDiscountedPrice(tier.discountPercent)}/hr
                            </p>
                            <p className="text-xs text-gray-400">
                              Save Rs.{calculateSavings(tier.minHours, tier.discountPercent)}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeTier(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Add Tier Button */}
                {tiers.length < 5 && (
                  <button
                    onClick={addTier}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Discount Tier
                  </button>
                )}
              </div>

              {/* Preview Card */}
              {tiers.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-900 mb-3">
                    How guests will see your discounts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tiers
                      .sort((a, b) => a.minHours - b.minHours)
                      .map((tier, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200"
                        >
                          {tier.minHours}+ hrs: {tier.discountPercent}% off
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "bonus" && (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Bonus Hours Offer</p>
                  <p>
                    Offer free bonus hours when guests book a minimum duration. 
                    For example, "Book 4+ hours and get 1 hour FREE!" 
                    This is a great way to increase booking duration.
                  </p>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Enable Bonus Hours</p>
                  <p className="text-sm text-gray-500">Give free hours for longer bookings</p>
                </div>
                <button
                  onClick={() => setBonusOffer({ ...bonusOffer, enabled: !bonusOffer.enabled })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    bonusOffer.enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      bonusOffer.enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Bonus Configuration */}
              {bonusOffer.enabled && (
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Hours Required
                      </label>
                      <select
                        value={bonusOffer.minHours}
                        onChange={(e) => setBonusOffer({ ...bonusOffer, minHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {[3, 4, 5, 6, 7, 8, 10, 12].map((h) => (
                          <option key={h} value={h}>
                            {h} hours
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Bonus Hours
                      </label>
                      <select
                        value={bonusOffer.bonusHours}
                        onChange={(e) => setBonusOffer({ ...bonusOffer, bonusHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {[1, 2, 3].map((h) => (
                          <option key={h} value={h}>
                            {h} hour{h > 1 ? "s" : ""} FREE
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={bonusOffer.label}
                      onChange={(e) => setBonusOffer({ ...bonusOffer, label: e.target.value })}
                      placeholder={`Book ${bonusOffer.minHours}+ hours, get ${bonusOffer.bonusHours} hour${bonusOffer.bonusHours > 1 ? "s" : ""} FREE!`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={60}
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Gift className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-700">
                          {bonusOffer.label ||
                            `Book ${bonusOffer.minHours}+ hours, get ${bonusOffer.bonusHours} hour${bonusOffer.bonusHours > 1 ? "s" : ""} FREE!`}
                        </p>
                        <p className="text-sm text-green-600">
                          Value: Rs.{(baseRate * bonusOffer.bonusHours).toFixed(0)} savings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison with Tiers */}
              {bonusOffer.enabled && tiers.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Note: Using both offers</p>
                      <p>
                        Bonus hours and tiered discounts can work together! Guests booking{" "}
                        {bonusOffer.minHours}+ hours will get both the tier discount AND the bonus hour.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {tiers.length > 0 && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                {tiers.length} tier{tiers.length > 1 ? "s" : ""}
              </span>
            )}
            {bonusOffer.enabled && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Bonus active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Discounts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}