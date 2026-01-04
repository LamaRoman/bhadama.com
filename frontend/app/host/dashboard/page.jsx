"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast, Toaster } from "react-hot-toast";
import { 
  RefreshCw, BarChart3, Building, Star, Calendar, 
  DollarSign, TrendingUp, Crown, HelpCircle, FileText 
} from "lucide-react";

// Import tab components
import OverviewTab from "./components/tabs/OverviewTab";
import ListingsTab from "./components/tabs/ListingsTab";
import ReviewsTab from "./components/tabs/ReviewsTab";
import BookingsTab from "./components/tabs/BookingsTab";
import EarningsTab from "./components/tabs/EarningsTab";
import AnalyticsTab from "./components/tabs/AnalyticsTab";
import SubscriptionTab from "./components/tabs/SubscriptionTab";
import SupportTab from "./components/tabs/SupportTab";
import BlogsTab from "./components/tabs/BlogsTab";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "listings", label: "Listings", icon: Building },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "earnings", label: "Earnings", icon: DollarSign },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "blogs", label: "Blogs", icon: FileText },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "subscription", label: "Subscription", icon: Crown },
  { id: "support", label: "Support", icon: HelpCircle }
];

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
    <div className="max-w-7xl mx-auto animate-pulse space-y-8">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  </div>
);

export default function HostDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [counts, setCounts] = useState({ listings: 0, reviews: 0, bookings: 0, blogs: 0 });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Fetch counts for tab badges (silent fail - counts are optional)
  useEffect(() => {
    if (!user || user.role !== "HOST") return;
    
    const fetchCounts = async () => {
      const safeFetch = async (url, key) => {
        try {
          const res = await api(url);
          return res;
        } catch {
          return { [key]: [] };
        }
      };

      try {
        const [listingsRes, reviewsRes, bookingsRes, blogsRes] = await Promise.all([
          safeFetch("/api/host/listings", "listings"),
          safeFetch("/api/host/reviews", "reviews"),
          safeFetch("/api/bookings/host", "bookings"),
          safeFetch("/api/host/blogs", "blogs"),
        ]);
        
        setCounts({
          listings: (listingsRes?.listings || listingsRes || []).length,
          reviews: (reviewsRes?.reviews || []).length,
          bookings: (bookingsRes?.bookings || bookingsRes || []).length,
          blogs: (blogsRes?.blogs || []).length,
        });
      } catch (e) {
        console.log("Counts fetch skipped:", e.message);
      }
    };
    
    fetchCounts();
  }, [user, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Handle tab change (also used by child components)
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const renderTabContent = () => {
    const props = { refreshKey, onRefresh: handleRefresh, user, onTabChange: handleTabChange };

    switch (activeTab) {
      case "overview":
        return <OverviewTab key={refreshKey} {...props} />;
      case "listings":
        return <ListingsTab key={refreshKey} {...props} />;
      case "bookings":
        return <BookingsTab key={refreshKey} {...props} />;
      case "earnings":
        return <EarningsTab key={refreshKey} {...props} />;
      case "reviews":
        return <ReviewsTab key={refreshKey} {...props} />;
      case "blogs":
        return <BlogsTab key={refreshKey} {...props} />;
      case "analytics":
        return <AnalyticsTab key={refreshKey} {...props} />;
      case "subscription":
        return <SubscriptionTab key={refreshKey} {...props} />;
      case "support":
        return <SupportTab key={refreshKey} {...props} />;
      default:
        return <OverviewTab key={refreshKey} {...props} />;
    }
  };

  if (authLoading || !user || user.role !== "HOST") {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Host Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Manage your business</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mt-4 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const count = 
                tab.id === "listings" ? counts.listings : 
                tab.id === "reviews" ? counts.reviews : 
                tab.id === "bookings" ? counts.bookings :
                tab.id === "blogs" ? counts.blogs : 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6 text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} Host Dashboard
        </div>
      </footer>
    </div>
  );
}