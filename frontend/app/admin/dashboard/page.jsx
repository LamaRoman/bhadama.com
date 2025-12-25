"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { api } from "../../utils/api.js";
import {
  BarChart3, Users, Calendar, DollarSign,
  Star, TrendingUp, Settings,
  Search, RefreshCw, Shield, Home,
  Download, Activity, Bell,
  UserPlus, AlertTriangle,
  TrendingDown, FileText, Trash2
} from "lucide-react";
import { toast, Toaster } from 'react-hot-toast';

// Constants
const DATE_RANGE_OPTIONS = [
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "90days", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" }
];

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users, badgeKey: "suspendedUsers" },
  { id: "listings", label: "Listings", icon: Home, badgeKey: "listings" },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star, badgeKey: "pendingReviews" },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const INITIAL_DASHBOARD_STATE = {
  stats: null,
  recentBookings: [],
  recentUsers: [],
  pendingReviews: [],
  listings: [],
  auditLogs: [],
  suspendedUsers: [],
  featureFlags: [],
  platformHealth: {}
};

// Utility functions
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

// Memoized Components
const StatCard = memo(({ title, value, change = 0, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
});
StatCard.displayName = 'StatCard';

const HealthMetric = memo(({ label, value, status }) => {
  const statusColors = {
    good: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.good}`}>
        {value}
      </span>
    </div>
  );
});
HealthMetric.displayName = 'HealthMetric';

const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    CONFIRMED: { color: "bg-green-100 text-green-800", label: "Confirmed" },
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    COMPLETED: { color: "bg-blue-100 text-blue-800", label: "Completed" },
    ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
    INACTIVE: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    SUSPENDED: { color: "bg-red-100 text-red-800", label: "Suspended" },
  };

  const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status || "Unknown" };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ActionCard = memo(({ title, description, icon: Icon, color, onClick }) => {
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
    <button
      onClick={onClick}
      className={`${colorClasses[color] || colorClasses.blue} rounded-xl p-5 text-left transition-all border hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium opacity-75">→</span>
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
});
ActionCard.displayName = 'ActionCard';

const StarRating = memo(({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
));
StarRating.displayName = 'StarRating';

const TabButton = memo(({ tab, isActive, badge, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        isActive
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
      {badge > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
});
TabButton.displayName = 'TabButton';

const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we load your data</p>
      </div>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Main Component
export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD_STATE);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Safe API call helper
  const safeApiCall = useCallback(async (url, description) => {
    try {
      const res = await api(url);
      return res;
    } catch (err) {
      console.error(`[API Error] ${description} (${url}):`, err?.message || err);
      return null;
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.role === "ADMIN") return;
    
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
        safeApiCall(`/api/admin/stats?range=${dateRange}`, 'Stats'),
        safeApiCall('/api/admin/bookings/recent', 'Recent Bookings'),
        safeApiCall('/api/admin/users/recent', 'Recent Users'),
        safeApiCall('/api/admin/listings?limit=5&status=PENDING', 'Pending Listings'),
        safeApiCall('/api/admin/reviews/pending', 'Pending Reviews'),
        safeApiCall('/api/admin/audit-logs', 'Audit Logs'),
        safeApiCall('/api/admin/users/suspended', 'Suspended Users'),
        safeApiCall('/api/admin/feature-flags', 'Feature Flags'),
        safeApiCall('/api/admin/health', 'Platform Health')
      ]);

      setDashboard({
        stats: statsData,
        recentBookings: Array.isArray(bookingsData) ? bookingsData : [],
        recentUsers: Array.isArray(usersData) ? usersData : [],
        pendingReviews: Array.isArray(reviewsData) ? reviewsData : [],
        listings: listingsData?.listings || [],
        auditLogs: Array.isArray(auditLogsData) ? auditLogsData : [],
        suspendedUsers: Array.isArray(suspendedUsersData) ? suspendedUsersData : [],
        featureFlags: Array.isArray(featureFlagsData) ? featureFlagsData : [],
        platformHealth: healthData || {}
      });
    } catch (error) {
      console.error("Unexpected error in fetchDashboardData:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user?.role, dateRange, safeApiCall]);

  // Refresh handler with visual feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  }, [fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchDashboardData();
    }
  }, [user?.role, dateRange, fetchDashboardData]);

  // Action handlers
  const handleApproveListing = useCallback(async (listingId) => {
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
  }, [fetchDashboardData]);

  const handleRejectListing = useCallback(async (listingId, reason = "Does not meet guidelines") => {
    try {
      await api(`/api/admin/listings/${listingId}/status`, {
        method: 'PUT',
        body: { status: 'REJECTED', reason }
      });
      toast.success('Listing rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  }, [fetchDashboardData]);

  const handleRestoreUser = useCallback(async (userId) => {
    try {
      await api(`/api/admin/users/${userId}/restore`, { method: 'PUT' });
      toast.success('User restored');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to restore user');
    }
  }, [fetchDashboardData]);

  const handleToggleFeature = useCallback(async (flagId, enabled) => {
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
  }, [fetchDashboardData]);

  const handleApproveReview = useCallback(async (reviewId) => {
    try {
      await api(`/api/admin/reviews/${reviewId}/approve`, { method: 'PUT' });
      toast.success('Review approved');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve review');
    }
  }, [fetchDashboardData]);

  const handleRejectReview = useCallback(async (reviewId, reason = "Violates guidelines") => {
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
  }, [fetchDashboardData]);

  const handleExportData = useCallback(async (type) => {
    try {
      const response = await api(`/api/admin/export/${type}`);
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
  }, []);

  // Memoized values
  const tabBadges = useMemo(() => ({
    suspendedUsers: dashboard.suspendedUsers?.length || 0,
    listings: dashboard.listings?.length || 0,
    pendingReviews: dashboard.pendingReviews?.length || 0,
  }), [dashboard.suspendedUsers?.length, dashboard.listings?.length, dashboard.pendingReviews?.length]);

  const quickActions = useMemo(() => [
    { title: "Create Listing", description: "Add new event space", icon: Home, color: "blue", href: '/host/listings/create' },
    { title: "Send Announcement", description: "Notify all users", icon: Bell, color: "green", action: () => toast.info("Announcement feature coming soon") },
    { title: "View Reports", description: "Generate insights", icon: TrendingUp, color: "purple", tab: 'analytics' },
    { title: "Moderation", description: "Review content", icon: Shield, color: "orange", tab: 'moderation' },
    { title: "User Management", description: "Manage user accounts", icon: Users, color: "red", tab: 'users' },
    { title: "Audit Logs", description: "View system logs", icon: FileText, color: "gray", tab: 'audit' },
    { title: "Platform Settings", description: "Configure system", icon: Settings, color: "indigo", tab: 'settings' },
    { title: "Export Data", description: "Download reports", icon: Download, color: "yellow", action: () => handleExportData('all') },
  ], [handleExportData]);

  const handleQuickAction = useCallback((action) => {
    if (action.href) {
      window.location.href = action.href;
    } else if (action.tab) {
      setActiveTab(action.tab);
    } else if (action.action) {
      action.action();
    }
  }, []);

  if (loading) {
    return (
      <ProtectedRoute user={user} role="ADMIN">
        <LoadingSpinner />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute user={user} role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Toaster position="top-right" />

        {/* Dashboard Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
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
                  {DATE_RANGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
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
              {TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  badge={tab.badgeKey ? tabBadges[tab.badgeKey] : 0}
                  onClick={setActiveTab}
                />
              ))}
            </div>
          </div>
        </div>

        <main className="px-6 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(dashboard.stats?.totalRevenue)}
              change={dashboard.stats?.revenueChange || 0}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Total Bookings"
              value={formatNumber(dashboard.stats?.totalBookings)}
              change={dashboard.stats?.bookingsChange || 0}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Active Users"
              value={formatNumber(dashboard.stats?.activeUsers)}
              change={dashboard.stats?.usersChange || 0}
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Avg. Rating"
              value={dashboard.stats?.avgRating?.toFixed(1) || "0.0"}
              change={dashboard.stats?.ratingChange || 0}
              icon={Star}
              color="yellow"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue Chart Placeholder */}
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
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Revenue chart placeholder</p>
                    <p className="text-sm text-gray-400 mt-1">Add chart library (Recharts, Chart.js)</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboard.recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No recent bookings found
                          </td>
                        </tr>
                      ) : (
                        dashboard.recentBookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.bookingNumber?.substring(0, 8) || booking.id?.substring(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {booking.listing?.title || "Unknown listing"}
                                </p>
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
                                <span className="text-sm">{booking.user?.name || "Unknown"}</span>
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
                        ))
                      )}
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
                    status={(parseFloat(dashboard.platformHealth?.bookingSuccessRate) || 98) > 95 ? "good" : "warning"}
                  />
                  <HealthMetric
                    label="User Satisfaction"
                    value={dashboard.platformHealth?.userSatisfaction || "4.7/5"}
                    status={(parseFloat(dashboard.platformHealth?.userSatisfaction) || 4.7) > 4.5 ? "good" : "warning"}
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
                          <span className="text-sm font-medium">{review.user?.name || "Unknown"}</span>
                          <div className="ml-auto">
                            <StarRating rating={review.rating || 0} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{review.comment || "No comment"}</p>
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
                  {dashboard.recentUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent users</p>
                  ) : (
                    dashboard.recentUsers.slice(0, 4).map((recentUser) => (
                      <div key={recentUser.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                          {recentUser.profilePhoto ? (
                            <img
                              src={recentUser.profilePhoto}
                              alt={recentUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {recentUser.name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{recentUser.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              {recentUser.role || "USER"}
                            </span>
                            <StatusBadge status={recentUser.status || "ACTIVE"} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(recentUser.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Activity Timeline */}
          {dashboard.auditLogs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Admin Activity</h3>
              <div className="space-y-3">
                {dashboard.auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{log.admin || "System"}</p>
                        <p className="text-sm text-gray-600">{log.action} — {log.entity}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {log.actionType || "ACTION"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Deleted Users */}
          {dashboard.suspendedUsers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Soft Deleted Users
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.suspendedUsers.map((deletedUser) => (
                  <div key={deletedUser.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{deletedUser.name}</p>
                      <p className="text-xs text-gray-500">{deletedUser.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Deleted: {formatDate(deletedUser.deletedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreUser(deletedUser.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200 rounded-lg transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Flags */}
          {dashboard.featureFlags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Feature Flags
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.featureFlags.map((flag) => (
                  <div key={flag.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{flag.key}</p>
                      <p className="text-sm text-gray-500">{flag.description || "No description"}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFeature(flag.id, !flag.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-label={`Toggle ${flag.key}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <ActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  color={action.color}
                  onClick={() => handleQuickAction(action)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}