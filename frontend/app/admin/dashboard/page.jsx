// app/admin/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { api } from "../../../utils/api.js";
import { 
  BarChart3, Users, Calendar, DollarSign, 
  Star, TrendingUp, AlertCircle, Settings,
  MessageSquare, Eye, Clock, CheckCircle,
  XCircle, MoreVertical, Download, Filter,
  Search, RefreshCw, Shield, Home,
  Package, CreditCard, Activity, Bell
} from "lucide-react";
import { toast, Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [listings, setListings] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData, usersData, listingsData, reviewsData] = await Promise.all([
        api(`/api/admin/stats?range=${dateRange}`),
        api('/api/admin/bookings/recent'),
        api('/api/admin/users/recent'),
        api('/api/admin/listings?limit=5'),
        api('/api/admin/reviews/pending')
      ]);
      
      setStats(statsData);
      setRecentBookings(bookingsData);
      setRecentUsers(usersData);
      setListings(listingsData?.listings || []);
      setPendingReviews(reviewsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleApproveListing = async (listingId) => {
    try {
      await api(`/api/admin/listings/${listingId}/status`, {
        method: 'PUT',
        body: { status: 'ACTIVE' }
      });
      toast.success('Listing approved');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve listing');
    }
  };

  const handleRejectListing = async (listingId) => {
    try {
      await api(`/api/admin/listings/${listingId}/status`, {
        method: 'PUT',
        body: { status: 'INACTIVE' }
      });
      toast.success('Listing rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute user={user} role="ADMIN">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute user={user} role="ADMIN">
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Navbar />
        
        {/* Dashboard Header */}
        <div className="border-b bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}!</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">This year</option>
                </select>
                <button
                  onClick={fetchDashboardData}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex space-x-8 border-b overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "bookings", label: "Bookings", icon: Calendar },
                { id: "users", label: "Users", icon: Users },
                { id: "listings", label: "Listings", icon: Home },
                { id: "reviews", label: "Reviews", icon: Star, badge: pendingReviews.length },
                { id: "analytics", label: "Analytics", icon: TrendingUp },
                { id: "moderation", label: "Moderation", icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <main className="px-6 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue)}
              change={stats?.revenueChange || 0}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Total Bookings"
              value={stats?.totalBookings?.toLocaleString() || "0"}
              change={stats?.bookingsChange || 0}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers?.toLocaleString() || "0"}
              change={stats?.usersChange || 0}
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Avg. Rating"
              value={stats?.avgRating?.toFixed(1) || "0.0"}
              change={stats?.ratingChange || 0}
              icon={Star}
              color="yellow"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Last 30 days</span>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Revenue chart would appear here</p>
                    <p className="text-sm text-gray-400 mt-1">Integration with charts library needed</p>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {booking.bookingNumber?.substring(0, 10)}...
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{booking.listing?.title}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(booking.bookingDate)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(booking.totalPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={booking.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Platform Health */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Health</h3>
                <div className="space-y-4">
                  <HealthMetric
                    label="Booking Success Rate"
                    value="98%"
                    status="good"
                  />
                  <HealthMetric
                    label="User Satisfaction"
                    value="4.7/5"
                    status="good"
                  />
                  <HealthMetric
                    label="Support Response Time"
                    value="< 2h"
                    status="warning"
                  />
                  <HealthMetric
                    label="System Uptime"
                    value="99.9%"
                    status="good"
                  />
                </div>
              </div>

              {/* Pending Reviews */}
              {pendingReviews.length > 0 && (
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pending Reviews</h3>
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      {pendingReviews.length} pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {pendingReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {review.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{review.user?.name}</span>
                          <div className="flex ml-auto">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{review.comment}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">
                            Approve
                          </button>
                          <button className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingReviews.length > 3 && (
                      <button 
                        onClick={() => setActiveTab('reviews')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {pendingReviews.length} pending reviews →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {recentUsers.slice(0, 4).map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionCard
                title="Create Listing"
                description="Add new event space"
                icon={Home}
                color="blue"
                onClick={() => window.location.href = '/host/listings/create'}
              />
              <ActionCard
                title="Send Announcement"
                description="Notify all users"
                icon={Bell}
                color="green"
                onClick={() => console.log("Send announcement")}
              />
              <ActionCard
                title="View Reports"
                description="Generate insights"
                icon={TrendingUp}
                color="purple"
                onClick={() => setActiveTab('analytics')}
              />
              <ActionCard
                title="Moderation"
                description="Review content"
                icon={Shield}
                color="orange"
                onClick={() => setActiveTab('moderation')}
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Helper Components
const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

const HealthMetric = ({ label, value, status }) => {
  const statusColors = {
    good: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    CONFIRMED: { color: "bg-green-100 text-green-800", label: "Confirmed" },
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    COMPLETED: { color: "bg-blue-100 text-blue-800", label: "Completed" },
  };

  const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const ActionCard = ({ title, description, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} rounded-xl p-5 text-left transition-colors`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium opacity-75">→</span>
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};