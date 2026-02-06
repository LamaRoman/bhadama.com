"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import {
  StatCard, StatusBadge, LoadingSpinner,
  formatCurrency, formatNumber, formatDate
} from "../shared";
import { DollarSign, Calendar, Users, Star, Activity, UserPlus, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function OverviewTab({ dateRange, onTabChange }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [platformHealth, setPlatformHealth] = useState({});
  const [status,setStatus] = useState("all");
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, usersRes, reviewsRes, healthRes] = await Promise.all([
        api(`/api/admin/stats?range=${dateRange}`).catch(() => null),
        api('/api/admin/bookings/recent?limit=5').catch(() => []),
        api('/api/admin/users/recent?limit=5').catch(() => []),
        api(`/api/admin/reviews?status=${status}&limit=3`).catch(() => []),
        api('/api/admin/health').catch(() => ({}))
      ]);

      setStats(statsRes);
      setRecentBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setRecentUsers(Array.isArray(usersRes) ? usersRes : []);
      setPendingReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
      setPlatformHealth(healthRes || {});
    } catch (error) {
      console.error("Error fetching overview data:", error);
      toast.error("Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }, [dateRange,status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSpinner message="Loading overview..." />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue?.value)}
          change={stats?.revenue?.change || 0}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Bookings"
          value={formatNumber(stats?.bookings?.value)}
          change={stats?.bookings?.change || 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={formatNumber(stats?.users?.value)}
          change={stats?.users?.change || 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Avg. Rating"
          value={stats?.rating?.value?.toFixed(1) || "0.0"}
          change={stats?.rating?.change || 0}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <button
                onClick={() => onTabChange?.('bookings')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No recent bookings
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.listing?.title || "Unknown listing"}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-blue-600">
                                {booking.user?.name?.charAt(0) || "U"}
                              </span>
                            </div>
                            <span className="text-sm">{booking.user?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Platform Health */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Platform Health
            </h3>
            <div className="space-y-3">
              {platformHealth?.metrics ? (
                Object.entries(platformHealth.metrics).map(([key, metric]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{metric.label}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      metric.status === 'healthy' ? 'bg-green-100 text-green-800' :
                      metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {metric.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">System Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Reviews */}
          {pendingReviews.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Pending Reviews
                </h3>
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  {pendingReviews.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{review.user?.name || "Unknown"}</span>
                      <span className="text-xs text-gray-500">★ {review.rating}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{review.comment || "No comment"}</p>
                  </div>
                ))}
                <button
                  onClick={() => onTabChange?.('reviews')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all pending reviews →
                </button>
              </div>
            </div>
          )}

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" />
              Recent Users
            </h3>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent users</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-white font-bold text-sm">{user.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {user.role || "USER"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}