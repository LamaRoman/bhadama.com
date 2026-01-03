"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../utils/api";
import { toast } from "react-hot-toast";
import {
  Settings, DollarSign, Users, TrendingUp,
  Edit2, Save, X, Loader2, ChevronDown,
  Crown, Zap, Star, Rocket, AlertCircle,
  Eye, MoreHorizontal, Calendar
} from "lucide-react";

const TIER_ICONS = { FREE: Star, BASIC: Zap, PRO: Crown, PREMIUM: Rocket };

const TIER_COLORS = {
  FREE: "bg-gray-100 text-gray-700",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  PREMIUM: "bg-amber-100 text-amber-700",
};

export default function TierManagementTab({ userAdminType }) {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pricingForm, setPricingForm] = useState({});
  const [editingPricing, setEditingPricing] = useState(null);

  const isSuperAdmin = userAdminType === "SUPER_ADMIN";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeSubTab === "overview" || activeSubTab === "tiers") {
          const [tiersRes, statsRes] = await Promise.all([
            api("/api/admin/tiers/tiers"),
            api("/api/admin/tiers/stats"),
          ]);
          if (!tiersRes.error) setTiers(tiersRes.tiers || []);
          if (!statsRes.error) setStats(statsRes);
        } else if (activeSubTab === "subscriptions") {
          const res = await api("/api/admin/tiers/subscriptions");
          if (!res.error) setSubscriptions(res.subscriptions || []);
        } else if (activeSubTab === "revenue") {
          const statsRes = await api("/api/admin/tiers/stats");
          if (!statsRes.error) setStats(statsRes);
          const revenueRes = await api("/api/admin/tiers/revenue");
          if (!revenueRes.error) setStats(prev => ({ ...prev, revenue: revenueRes }));
        }
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSubTab]);

  const startEditTier = (tier) => {
    setEditingTier(tier.id);
    setEditForm({
      displayName: tier.displayName,
      description: tier.description || "",
      maxListings: tier.maxListings,
      maxPhotosPerListing: tier.maxPhotosPerListing,
      maxBlogPostsPerMonth: tier.maxBlogPostsPerMonth,
      featuredListingSlots: tier.featuredListingSlots,
      commissionPercent: tier.commissionPercent,
      trialDays: tier.trialDays,
    });
  };

  const saveTier = async (tierId) => {
    setSaving(true);
    try {
      const res = await api(`/api/admin/tiers/tiers/${tierId}`, {
        method: "PUT",
        body: editForm,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Tier updated");
        setTiers(prev => prev.map(t => t.id === tierId ? { ...t, ...editForm } : t));
        setEditingTier(null);
      }
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const startEditPricing = (tier) => {
    setEditingPricing(tier.id);
    const pricing = {};
    tier.pricing?.forEach(p => {
      pricing[`${p.billingCycle}_${p.currency}`] = {
        price: p.price,
        discountPercent: p.discountPercent,
      };
    });
    setPricingForm(pricing);
  };

  const savePricing = async (tierId) => {
    setSaving(true);
    try {
      const pricingArray = Object.entries(pricingForm).map(([key, value]) => {
        const [billingCycle, currency] = key.split("_");
        return { billingCycle, currency, price: value.price, discountPercent: value.discountPercent };
      });

      const res = await api(`/api/admin/tiers/tiers/${tierId}/pricing`, {
        method: "PUT",
        body: { pricing: pricingArray },
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Pricing updated");
        setEditingPricing(null);
        // Refresh tiers
        const tiersRes = await api("/api/admin/tiers/tiers");
        if (!tiersRes.error) setTiers(tiersRes.tiers || []);
      }
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount, currency = "NPR") => {
    if (amount === 0) return "Free";
    return currency === "USD" ? `$${amount}` : `Rs. ${amount?.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tier Management</h2>
        <p className="text-gray-600">Manage host subscription tiers and pricing</p>
        {!isSuperAdmin && (
          <p className="text-amber-600 text-sm mt-1">View only - SUPER_ADMIN required for edits</p>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "tiers", label: "Tier Settings", icon: Settings },
          { id: "subscriptions", label: "Subscriptions", icon: Users },
          { id: "revenue", label: "Revenue", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeSubTab === tab.id ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeSubTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.subscriptionsByTier?.reduce((sum, t) => sum + t.count, 0) || 0}
                      </p>
                      <p className="text-sm text-gray-500">Active Subscriptions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue?.thisMonth || 0)}</p>
                      <p className="text-sm text-gray-500">This Month</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue?.total || 0)}</p>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.expiringSoon || 0}</p>
                      <p className="text-sm text-gray-500">Expiring Soon</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions by Tier */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Subscriptions by Tier</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.subscriptionsByTier?.map((item) => {
                    const Icon = TIER_ICONS[item.tierName] || Star;
                    return (
                      <div key={item.tierName} className={`p-4 rounded-xl ${TIER_COLORS[item.tierName]}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{item.tier}</span>
                        </div>
                        <p className="text-2xl font-bold">{item.count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <div className="flex flex-wrap gap-4">
                  {stats.subscriptionsByStatus?.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        item.status === "ACTIVE" ? "bg-green-500" :
                        item.status === "TRIAL" ? "bg-blue-500" :
                        item.status === "EXPIRED" ? "bg-red-500" : "bg-gray-500"
                      }`} />
                      <span className="text-sm text-gray-600">{item.status}: <strong>{item.count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TIERS TAB */}
          {activeSubTab === "tiers" && (
            <div className="space-y-6">
              {tiers.map((tier) => {
                const Icon = TIER_ICONS[tier.name] || Star;
                const isEditing = editingTier === tier.id;
                const isEditingPrice = editingPricing === tier.id;

                return (
                  <div key={tier.id} className="bg-white rounded-xl border overflow-hidden">
                    {/* Tier Header */}
                    <div className={`p-4 ${TIER_COLORS[tier.name]} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6" />
                        <div>
                          <h3 className="font-bold text-lg">{tier.displayName}</h3>
                          <p className="text-sm opacity-80">{tier._count?.subscriptions || 0} active subscriptions</p>
                        </div>
                      </div>
                      {isSuperAdmin && !isEditing && (
                        <button
                          onClick={() => startEditTier(tier)}
                          className="p-2 hover:bg-white/30 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Tier Settings */}
                    <div className="p-6">
                      {isEditing ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Listings</label>
                            <input
                              type="number"
                              value={editForm.maxListings}
                              onChange={(e) => setEditForm({ ...editForm, maxListings: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">-1 = unlimited</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                            <input
                              type="number"
                              value={editForm.commissionPercent}
                              onChange={(e) => setEditForm({ ...editForm, commissionPercent: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="0"
                              max="50"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Photos/Listing</label>
                            <input
                              type="number"
                              value={editForm.maxPhotosPerListing}
                              onChange={(e) => setEditForm({ ...editForm, maxPhotosPerListing: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trial Days</label>
                            <input
                              type="number"
                              value={editForm.trialDays}
                              onChange={(e) => setEditForm({ ...editForm, trialDays: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Slots</label>
                            <input
                              type="number"
                              value={editForm.featuredListingSlots}
                              onChange={(e) => setEditForm({ ...editForm, featuredListingSlots: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blogs/Month</label>
                            <input
                              type="number"
                              value={editForm.maxBlogPostsPerMonth}
                              onChange={(e) => setEditForm({ ...editForm, maxBlogPostsPerMonth: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="-1"
                            />
                          </div>
                          <div className="col-span-2 flex gap-2 items-end">
                            <button
                              onClick={() => saveTier(tier.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTier(null)}
                              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Max Listings</p>
                            <p className="font-semibold">{tier.maxListings === -1 ? "Unlimited" : tier.maxListings}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Commission</p>
                            <p className="font-semibold">{tier.commissionPercent}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Photos/Listing</p>
                            <p className="font-semibold">{tier.maxPhotosPerListing}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Trial Days</p>
                            <p className="font-semibold">{tier.trialDays || "None"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Featured Slots</p>
                            <p className="font-semibold">{tier.featuredListingSlots}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Blogs/Month</p>
                            <p className="font-semibold">{tier.maxBlogPostsPerMonth === -1 ? "Unlimited" : tier.maxBlogPostsPerMonth}</p>
                          </div>
                        </div>
                      )}

                      {/* Pricing Section */}
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Pricing</h4>
                          {isSuperAdmin && !isEditingPrice && (
                            <button
                              onClick={() => startEditPricing(tier)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Edit Pricing
                            </button>
                          )}
                        </div>

                        {isEditingPrice ? (
                          <div className="space-y-4">
                            {["NPR", "USD"].map((currency) => (
                              <div key={currency} className="bg-gray-50 rounded-lg p-4">
                                <p className="font-medium mb-3">{currency}</p>
                                <div className="grid grid-cols-3 gap-4">
                                  {["WEEKLY", "MONTHLY", "YEARLY"].map((cycle) => {
                                    const key = `${cycle}_${currency}`;
                                    return (
                                      <div key={cycle}>
                                        <label className="block text-xs text-gray-500 mb-1">{cycle}</label>
                                        <input
                                          type="number"
                                          value={pricingForm[key]?.price || 0}
                                          onChange={(e) => setPricingForm({
                                            ...pricingForm,
                                            [key]: { ...pricingForm[key], price: parseFloat(e.target.value) }
                                          })}
                                          className="w-full px-2 py-1 border rounded text-sm"
                                          min="0"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <button
                                onClick={() => savePricing(tier.id)}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                              >
                                {saving ? "Saving..." : "Save Pricing"}
                              </button>
                              <button
                                onClick={() => setEditingPricing(null)}
                                className="px-4 py-2 border rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {["NPR", "USD"].map((currency) => (
                              <div key={currency} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-2">{currency}</p>
                                <div className="space-y-1 text-sm">
                                  {tier.pricing?.filter(p => p.currency === currency).map((p) => (
                                    <div key={p.billingCycle} className="flex justify-between">
                                      <span className="text-gray-600">{p.billingCycle}</span>
                                      <span className="font-medium">{formatCurrency(p.finalPrice, currency)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUBSCRIPTIONS TAB */}
          {activeSubTab === "subscriptions" && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Host</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Tier</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Billing</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Expires</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                            {sub.host?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sub.host?.name}</p>
                            <p className="text-xs text-gray-500">{sub.host?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${TIER_COLORS[sub.tier?.name]}`}>
                          {sub.tier?.displayName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          sub.status === "TRIAL" ? "bg-blue-100 text-blue-700" :
                          sub.status === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sub.billingCycle || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscriptions.length === 0 && (
                <div className="text-center py-12 text-gray-500">No subscriptions found</div>
              )}
            </div>
          )}

          {/* REVENUE TAB */}
          {activeSubTab === "revenue" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Gateway */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Revenue by Gateway</h3>
                  {stats.revenue?.byGateway?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.revenue.byGateway.map((g) => (
                        <div key={g.gateway} className="flex items-center justify-between">
                          <span className="text-gray-600">{g.gateway}</span>
                          <span className="font-semibold">{formatCurrency(g.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No revenue data yet</p>
                  )}
                </div>

                {/* By Tier */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Revenue by Tier</h3>
                  {stats.revenue?.byTier?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.revenue.byTier.map((t) => (
                        <div key={t.tier} className="flex items-center justify-between">
                          <span className="text-gray-600">{t.tier}</span>
                          <span className="font-semibold">{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No revenue data yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}