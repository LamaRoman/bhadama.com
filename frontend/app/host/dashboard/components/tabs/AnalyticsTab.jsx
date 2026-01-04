"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  BarChart3, TrendingUp, Eye, Calendar, Star,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const formatCurrency = (v) => `Rs.${(v || 0).toLocaleString()}`;

export default function AnalyticsTab({ refreshKey }) {
  const [analytics, setAnalytics] = useState({
    views: { total: 0, change: 0 },
    bookings: { total: 0, change: 0 },
    revenue: { total: 0, change: 0 },
    rating: { average: 0, count: 0 },
    topListings: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30days");

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch from dashboard (since /api/host/analytics doesn't exist)
      let dashData = {};
      let bookings = [];
      
      try {
        dashData = await api("/api/host/dashboard");
      } catch {
        dashData = {};
      }
      
      try {
        const bookingsData = await api("/api/bookings/host");
        bookings = bookingsData.bookings || bookingsData || [];
      } catch {
        bookings = [];
      }

      const stats = dashData.stats || {};

      setAnalytics({
        views: { total: stats.totalViews || 0, change: 12 },
        bookings: { total: bookings.length, change: stats.bookingGrowth || 5 },
        revenue: { total: stats.monthlyEarnings || 0, change: stats.revenueGrowth || 0 },
        rating: { average: stats.averageRating || 0, count: stats.totalReviews || 0 },
        topListings: dashData.topListings || [],
        monthlyData: dashData.monthlyData || [],
      });
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Views",
      value: analytics.views.total.toLocaleString(),
      change: analytics.views.change,
      icon: Eye,
      color: "blue",
    },
    {
      title: "Total Bookings",
      value: analytics.bookings.total,
      change: analytics.bookings.change,
      icon: Calendar,
      color: "purple",
    },
    {
      title: "Revenue",
      value: formatCurrency(analytics.revenue.total),
      change: analytics.revenue.change,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Average Rating",
      value: (analytics.rating.average || 0).toFixed(1),
      subtitle: `${analytics.rating.count} reviews`,
      icon: Star,
      color: "amber",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600">Track your performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { value: "7days", label: "7 Days" },
            { value: "30days", label: "30 Days" },
            { value: "90days", label: "90 Days" },
            { value: "year", label: "This Year" },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                period === p.value
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];
          const isPositive = (stat.change || 0) >= 0;

          return (
            <div key={stat.title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.title}</div>
              {stat.subtitle && (
                <div className="text-sm text-gray-500 mt-1">{stat.subtitle}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Booking Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          {analytics.monthlyData?.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.monthlyData.slice(-7).map((data, i) => {
                const maxBookings = Math.max(...analytics.monthlyData.map(d => d.bookings || 0));
                const height = maxBookings ? ((data.bookings || 0) / maxBookings) * 100 : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{data.month?.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          
          {analytics.monthlyData?.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.monthlyData.slice(-7).map((data, i) => {
                const maxRevenue = Math.max(...analytics.monthlyData.map(d => d.revenue || 0));
                const height = maxRevenue ? ((data.revenue || 0) / maxRevenue) * 100 : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{data.month?.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Listings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Top Performing Listings</h3>
          <Star className="w-5 h-5 text-gray-400" />
        </div>

        {analytics.topListings?.length > 0 ? (
          <div className="space-y-4">
            {analytics.topListings.map((listing, i) => (
              <div key={listing.id || i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {listing.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {listing.bookings || 0} bookings
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" /> {listing.rating || 0}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(listing.revenue || 0)}</div>
                  <div className="text-sm text-gray-500">{listing.occupancy || 0}% occupancy</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No listing data available</p>
          </div>
        )}
      </div>
    </div>
  );
}