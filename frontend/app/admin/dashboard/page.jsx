"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { api } from "../../utils/api.js";
import { 
  BarChart3, Users, Calendar, DollarSign, 
  Star, TrendingUp, AlertCircle, Settings,
  MessageSquare, Eye, Clock, CheckCircle,
  XCircle, MoreVertical, Download, Filter,
  Search, RefreshCw, Shield, Home,
  Package, CreditCard, Activity, Bell,
  UserPlus, AlertTriangle, Flag, BarChart,
  PieChart, LineChart, Database, Globe,
  Lock, Unlock, Trash2, Edit, EyeOff,
  TrendingDown, Users as UsersIcon,
  Home as HomeIcon, CreditCard as CreditCardIcon,
  Activity as ActivityIcon, FileText
} from "lucide-react";
import { toast, Toaster } from 'react-hot-toast';
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState({
    stats: null,
    recentBookings: [],
    recentUsers: [],
    pendingReviews: [],
    listings: [],
    auditLogs: [],
    suspendedUsers: [],
    featureFlags: [],
    platformHealth: {}
  });
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsData, 
        bookingsData, 
        usersData, 
        listingsData, 
        reviewsData,
        auditLogsData,
        suspendedUsersData,
        featureFlagsData,
        healthData
      ] = await Promise.all([
        api(`/api/admin/stats?range=${dateRange}`),
        api('/api/admin/bookings/recent'),
        api('/api/admin/users/recent'),
        api('/api/admin/listings?limit=5&status=PENDING'),
        api('/api/admin/reviews/pending'),
        api('/api/admin/audit-logs'),
        api('/api/admin/users/suspended'),
        api('/api/admin/feature-flags'),
        api('/api/admin/health')
      ]);
      
      setDashboard({
        stats: statsData,
        recentBookings: bookingsData,
        recentUsers: usersData,
        pendingReviews: reviewsData,
        listings: listingsData?.listings || [],
        auditLogs: auditLogsData || [],
        suspendedUsers: suspendedUsersData || [],
        featureFlags: featureFlagsData || [],
        platformHealth: healthData || {}
      });
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const handleRejectListing = async (listingId, reason = "Does not meet guidelines") => {
    try {
      await api(`/api/admin/listings/${listingId}/status`, {
        method: 'PUT',
        body: { 
          status: 'REJECTED',
          reason: reason
        }
      });
      toast.success('Listing rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await api(`/api/admin/users/${userId}/restore`, {
        method: 'PUT'
      });
      toast.success('User restored');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to restore user');
    }
  };

  const handleToggleFeature = async (flagId, enabled) => {
    try {
      await api(`/api/admin/features/${flagId}`, {
        method: 'PUT',
        body: { enabled }
      });
      toast.success(`Feature ${enabled ? 'enabled' : 'disabled'}`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update feature');
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await api(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'PUT'
      });
      toast.success('Review approved');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId, reason = "Violates guidelines") => {
    try {
      await api(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'PUT',
        body: { reason }
      });
      toast.success('Review rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject review');
    }
  };

  const handleExportData = async (type) => {
    try {
      const response = await api(`/api/admin/export/${type}`);
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${type} data`);
    } catch (error) {
      toast.error(`Failed to export ${type} data`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute user={user} role="ADMIN">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
              <p className="text-sm text-gray-400 mt-2">Please wait while we load your data</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute user={user} role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Toaster position="top-right" />
        
        
        {/* Dashboard Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm"
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || 'Admin'}!</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">This year</option>
                  <option value="all">All time</option>
                </select>
                <button
                  onClick={fetchDashboardData}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleExportData('all')}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Export data"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex space-x-8 border-b overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "users", label: "Users", icon: Users, badge: dashboard.suspendedUsers?.length },
                { id: "listings", label: "Listings", icon: Home, badge: dashboard.listings?.length },
                { id: "bookings", label: "Bookings", icon: Calendar },
                { id: "reviews", label: "Reviews", icon: Star, badge: dashboard.pendingReviews?.length },
                { id: "analytics", label: "Analytics", icon: TrendingUp },
                { id: "moderation", label: "Moderation", icon: Shield },
                { id: "audit", label: "Audit Logs", icon: FileText },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <main className="px-6 py-6">
          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              title="Total Revenue"
              value={formatCurrency(dashboard.stats?.totalRevenue)}
              change={dashboard.stats?.revenueChange || 0}
              icon={DollarSign}
              color="green"
              trend="up"
            />
            <StatCard
              title="Total Bookings"
              value={formatNumber(dashboard.stats?.totalBookings)}
              change={dashboard.stats?.bookingsChange || 0}
              icon={Calendar}
              color="blue"
              trend="up"
            />
            <StatCard
              title="Active Users"
              value={formatNumber(dashboard.stats?.activeUsers)}
              change={dashboard.stats?.usersChange || 0}
              icon={UsersIcon}
              color="purple"
              trend="up"
            />
            <StatCard
              title="Avg. Rating"
              value={dashboard.stats?.avgRating?.toFixed(1) || "0.0"}
              change={dashboard.stats?.ratingChange || 0}
              icon={Star}
              color="yellow"
              trend="up"
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Charts & Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Last 30 days</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View details →
                    </button>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Revenue chart would appear here</p>
                    <p className="text-sm text-gray-400 mt-1">Integration with charts library needed</p>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
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
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboard.recentBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {booking.bookingNumber?.substring(0, 8)}...
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{booking.listing?.title}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <span className="text-xs font-bold text-blue-600">
                                  {booking.user?.name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <span className="text-sm">{booking.user?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(booking.totalPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              View
                            </button>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Platform Health
                </h3>
                <div className="space-y-4">
                  <HealthMetric
                    label="Booking Success Rate"
                    value={dashboard.platformHealth?.bookingSuccessRate || "98%"}
                    status={dashboard.platformHealth?.bookingSuccessRate > 95 ? "good" : "warning"}
                  />
                  <HealthMetric
                    label="User Satisfaction"
                    value={dashboard.platformHealth?.userSatisfaction || "4.7/5"}
                    status={dashboard.platformHealth?.userSatisfaction > 4.5 ? "good" : "warning"}
                  />
                  <HealthMetric
                    label="Support Response Time"
                    value={dashboard.platformHealth?.supportResponseTime || "< 2h"}
                    status="good"
                  />
                  <HealthMetric
                    label="System Uptime"
                    value={dashboard.platformHealth?.systemUptime || "99.9%"}
                    status="good"
                  />
                  <HealthMetric
                    label="Error Rate"
                    value={dashboard.platformHealth?.errorRate || "0.1%"}
                    status="good"
                  />
                </div>
              </div>

              {/* Pending Reviews */}
              {dashboard.pendingReviews.length > 0 && (
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Pending Reviews
                    </h3>
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      {dashboard.pendingReviews.length} pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {dashboard.pendingReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
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
                          <button 
                            onClick={() => handleApproveReview(review.id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectReview(review.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                          <button className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    {dashboard.pendingReviews.length > 3 && (
                      <button 
                        onClick={() => setActiveTab('reviews')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {dashboard.pendingReviews.length} pending reviews →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-500" />
                  Recent Users
                </h3>
                <div className="space-y-4">
                  {dashboard.recentUsers.slice(0, 4).map((user) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {user.role}
                          </span>
                          {user.status === 'ACTIVE' ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                              {user.status}
                            </span>
                          )}
                        </div>
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

          {/* Admin Activity Timeline */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Admin Activity</h3>
            <div className="space-y-3">
              {dashboard.auditLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{log.admin}</p>
                      <p className="text-sm text-gray-600">{log.action} — {log.entity}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {log.actionType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Deleted Users */}
          {dashboard.suspendedUsers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Soft Deleted Users
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.suspendedUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Deleted: {formatDate(user.deletedAt)}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRestoreUser(user.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200 rounded-lg"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Flags */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-500" />
              Feature Flags
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.featureFlags.map((flag) => (
                <div key={flag.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{flag.key}</p>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature(flag.id, !flag.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${flag.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionCard
                title="Create Listing"
                description="Add new event space"
                icon={HomeIcon}
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
              <ActionCard
                title="User Management"
                description="Manage user accounts"
                icon={UsersIcon}
                color="red"
                onClick={() => setActiveTab('users')}
              />
              <ActionCard
                title="Audit Logs"
                description="View system logs"
                icon={FileText}
                color="gray"
                onClick={() => setActiveTab('audit')}
              />
              <ActionCard
                title="Platform Settings"
                description="Configure system"
                icon={Settings}
                color="indigo"
                onClick={() => setActiveTab('settings')}
              />
              <ActionCard
                title="Export Data"
                description="Download reports"
                icon={Download}
                color="yellow"
                onClick={() => handleExportData('all')}
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Helper Components
const StatCard = ({ title, value, change, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const trendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </motion.div>
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
    ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
    INACTIVE: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    SUSPENDED: { color: "bg-red-100 text-red-800", label: "Suspended" },
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
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
    green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
    red: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200",
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${colorClasses[color]} rounded-xl p-5 text-left transition-colors border`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium opacity-75">→</span>
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.button>
  );
};