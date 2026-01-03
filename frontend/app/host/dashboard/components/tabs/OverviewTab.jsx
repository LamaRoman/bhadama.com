"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { api } from "../../../../utils/api.js";
import { toast } from "react-hot-toast";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  DollarSign, Star, CalendarDays, Activity, Building, Home,
  Eye, Plus, ChevronLeft, ChevronRight,
} from "lucide-react";

// Lazy load charts
const DashboardCharts = dynamic(() => import("../DashboardCharts"), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {[1, 2].map(i => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
    </div>
  ),
  ssr: false,
});

// Constants
const BOOKINGS_PER_PAGE = 5;
const GRADIENTS = {
  revenue: "from-emerald-500 to-teal-600",
  occupancy: "from-blue-500 to-cyan-600",
  bookings: "from-purple-500 to-violet-600",
  rating: "from-amber-500 to-orange-600",
};

// Utilities
const formatCurrency = (v) => `Rs.${(v || 0).toLocaleString()}`;
const getTimeOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
};

// Stat Card Component
const StatCard = memo(({ title, value, icon: Icon, change, isCurrency, trend = "up", subtitle, gradient }) => (
  <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-12 translate-x-12`} />
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          trend === "up" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
        }`}>
          {trend === "up" ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">
      {isCurrency ? formatCurrency(value) : value}{title.includes("Rate") && "%"}
    </div>
    <h3 className="font-semibold text-gray-700">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
));
StatCard.displayName = "StatCard";

export default function OverviewTab({ refreshKey, user, onTabChange }) {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    stats: {},
    recentBookings: [],
    monthlyData: [],
    topListings: [],
  });
  const [reviewCount, setReviewCount] = useState(0);
  const [bookingPage, setBookingPage] = useState(1);

  const timeOfDay = useMemo(getTimeOfDay, []);
  
  const totalPages = useMemo(
    () => Math.ceil(dashboard.recentBookings.length / BOOKINGS_PER_PAGE),
    [dashboard.recentBookings.length]
  );
  
  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    return dashboard.recentBookings.slice(start, start + BOOKINGS_PER_PAGE);
  }, [dashboard.recentBookings, bookingPage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dash, rev] = await Promise.all([
          api("/api/host/dashboard"),
          api("/api/host/reviews").catch(() => ({ reviews: [] })),
        ]);

        setDashboard({
          stats: dash.stats || {},
          recentBookings: dash.recentBookings || [],
          monthlyData: dash.monthlyData || [],
          topListings: dash.topListings || [],
        });
        setReviewCount((rev.reviews || []).length);
      } catch (e) {
        console.error("Fetch error:", e);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const greetings = {
    morning: "🌅 Good morning",
    afternoon: "☀️ Good afternoon",
    evening: "🌙 Good evening",
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const stats = dashboard.stats || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {greetings[timeOfDay]}, {user?.name || "Host"}!
            </h2>
            <p className="text-gray-600 mt-1">Here's what's happening today</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg">
            <Star className="w-4 h-4" />
            <span className="font-semibold">{(stats.averageRating || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyEarnings || 0}
          icon={DollarSign}
          change={stats.revenueGrowth}
          isCurrency
          trend={(stats.revenueGrowth || 0) >= 0 ? "up" : "down"}
          subtitle="vs last month"
          gradient={GRADIENTS.revenue}
        />
        <StatCard
          title="Occupancy Rate"
          value={stats.occupancyRate || 0}
          icon={Activity}
          trend="up"
          subtitle="This month"
          gradient={GRADIENTS.occupancy}
        />
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings || 0}
          icon={CalendarDays}
          change={stats.bookingGrowth}
          trend="up"
          subtitle="Currently active"
          gradient={GRADIENTS.bookings}
        />
        <StatCard
          title="Guest Rating"
          value={(stats.averageRating || 0).toFixed(1)}
          icon={Star}
          subtitle={`${reviewCount} reviews`}
          gradient={GRADIENTS.rating}
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        monthlyData={dashboard.monthlyData}
        reviewStats={{ 
          totalReviews: reviewCount,
          reviewsByRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }  // Default empty
        }}
        reviews={[]}
      />

      {/* Recent Bookings */}
      {dashboard.recentBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Guest</th>
                  <th className="py-3 px-4 text-left font-medium">Listing</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Amount</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {(booking.guestName || "G")[0]}
                        </div>
                        <span className="font-medium text-gray-900">{booking.guestName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{booking.listing}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                        booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(booking.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <button
                onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                disabled={bookingPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-gray-500">Page {bookingPage} of {totalPages}</span>
              <button
                onClick={() => setBookingPage(p => Math.min(totalPages, p + 1))}
                disabled={bookingPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions & Top Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onTabChange("listings")}
              className="w-full p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4" /> View My Listings
            </button>
            <button
              onClick={() => onTabChange("reviews")}
              className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              Respond to Reviews
            </button>
            <Link
              href="/host/listings/new"
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Listing
            </Link>
          </div>
        </div>

        {/* Top Listings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Top Listings</h3>
            <Building className="w-5 h-5 text-gray-400" />
          </div>
          
          {dashboard.topListings?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dashboard.topListings.map(l => (
                <div key={l.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {l.image ? (
                        <img src={l.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Home className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{l.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        {l.rating || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Revenue</span>
                      <span className="font-medium">Rs.{l.revenue || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Occupancy</span>
                      <span className="font-medium">{l.occupancy || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Building className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No listings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}