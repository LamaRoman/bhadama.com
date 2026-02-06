"use client";

import { useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import {
  BarChart3, Users, Calendar, Star, TrendingUp,
  Settings, RefreshCw, Shield, Home, FileText, UserCog,
  MessageSquare
} from "lucide-react";
import { Toaster } from 'react-hot-toast';
import FeaturedTab from "../components/tabs/FeaturedTab";
import RoleManagementTab from "../components/tabs/RoleManagementTab.jsx";
import OverviewTab from "../components/tabs/OverviewTab";
import UsersTab from "../components/tabs/UsersTab";
import ListingsTab from "../components/tabs/ListingsTab";
import BookingsTab from "../components/tabs/BookingsTab";
import ReviewsTab from "../components/tabs/ReviewsTab";
import AnalyticsTab from "../components/tabs/AnalyticsTab";
import ModerationTab from "../components/tabs/ModerationTab";
import AuditLogsTab from "../components/tabs/AuditLogsTab";
import SettingsTab from "../components/tabs/SettingsTab";
import SupportTab from "../components/tabs/SupportTab";

const DATE_RANGE_OPTIONS = [
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "90days", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" }
];

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "listings", label: "Listings", icon: Home },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "featured", label: "Featured", icon: Star },
  { id: "roles", label: "Roles", icon: UserCog },
  { id: "support", label: "Support", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30days");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const renderTabContent = () => {
    const props = { dateRange, onTabChange: handleTabChange };

    switch (activeTab) {
      case "overview": return <OverviewTab key={refreshKey} {...props} />;
      case "users": return <UsersTab key={refreshKey} {...props} />;
      case "listings": return <ListingsTab key={refreshKey} {...props} />;
      case "bookings": return <BookingsTab key={refreshKey} {...props} />;
      case "reviews": return <ReviewsTab key={refreshKey} {...props} />;
      case "analytics": return <AnalyticsTab key={refreshKey} {...props} />;
      case "moderation": return <ModerationTab key={refreshKey} {...props} />;
      case "audit": return <AuditLogsTab key={refreshKey} {...props} />;
      case "settings": return <SettingsTab key={refreshKey} {...props} />;
      case "featured": return <FeaturedTab key={refreshKey} {...props} />;
      case "roles": return <RoleManagementTab key={refreshKey} {...props} />;
      case "support": return <SupportTab key={refreshKey} {...props} />;
      default: return <OverviewTab key={refreshKey} {...props} />;
    }
  };

  return (
    <ProtectedRoute role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Toaster position="top-right" />

        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || 'Admin'}!</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {DATE_RANGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-6">
            <div className="flex space-x-6 border-b overflow-x-auto">
              {TABS.map((tab) => {
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <main className="px-6 py-6">
          {renderTabContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}