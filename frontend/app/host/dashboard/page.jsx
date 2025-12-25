"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  XCircle,
  CheckCircle,
  Home,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  MessageSquare,
  Bell,
  Settings,
  Filter,
  Download,
  Eye,
  MoreVertical,
  TrendingDown,
  Target,
  PieChart,
  BarChart,
  LineChart,
  CalendarDays,
  Wallet,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  Info,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Users as UsersIcon,
  Building,
  MapPin,
  CreditCard,
  FileText,
  Award,
  Coffee,
  Moon,
  Sunrise,
  Sun,
  Waves,
  Zap as Lightning,
  Activity,
  Target as TargetIcon,
  Percent,
  TrendingUp as TrendingUpSolid,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  Edit,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Trash2,
  Send,
} from "lucide-react";

// Import charting library (install: npm install recharts)
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function HostDashboard() {
  const { user } = useAuth();
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard state
  const [dashboard, setDashboard] = useState({
    stats: null,
    recentBookings: [],
    monthlyData: [],
    topListings: [],
    upcomingTasks: [],
  });

  // Review state
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [reviewsView, setReviewsView] = useState("all");
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    responseRate: 0,
    recentReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    reviewsByRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Recent bookings pagination
  const [currentBookingPage, setCurrentBookingPage] = useState(1);
  const bookingsPerPage = 5;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 17) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        console.log("🔍 Fetching dashboard data...");
        const [dashboardRes, reviewsRes] = await Promise.all([
          api("/api/host/dashboard"),
          api("/api/host/reviews").catch(() => ({ reviews: [] })) // Graceful fallback
        ]);

        console.log("✅ Host dashboard data received:", {
          stats: dashboardRes.stats,
          recentBookingsCount: dashboardRes.recentBookings?.length || 0,
        });

        setDashboard({
          stats: dashboardRes.stats || getDefaultStats(),
          recentBookings: dashboardRes.recentBookings || getMockBookings(),
          monthlyData: dashboardRes.monthlyData || getMockMonthlyData(),
          topListings: dashboardRes.topListings || getMockTopListings(),
          upcomingTasks: dashboardRes.upcomingTasks || getMockTasks(),
        });

        // Set reviews
        const reviewsData = reviewsRes.reviews || getMockReviews();
        setReviews(reviewsData);
        calculateReviewStats(reviewsData);

      } catch (error) {
        console.error("❌ Dashboard fetch failed:", error);
        toast.error("Failed to load dashboard");

        // Set default data
        setDashboard({
          stats: getDefaultStats(),
          recentBookings: getMockBookings(),
          monthlyData: getMockMonthlyData(),
          topListings: getMockTopListings(),
          upcomingTasks: getMockTasks(),
        });
        
        const mockReviews = getMockReviews();
        setReviews(mockReviews);
        calculateReviewStats(mockReviews);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data generators
  const getMockBookings = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `booking-${i + 1}`,
      guestName: ['Alex Johnson', 'Sarah Miller', 'Michael Chen', 'Emily Davis', 'David Wilson', 'Jessica Brown'][i % 6],
      listing: ['Modern Downtown Loft', 'Cozy Mountain Cabin', 'Beachfront Villa', 'City Center Apartment'][i % 4],
      checkIn: `2024-03-${String(15 + i).padStart(2, '0')}`,
      checkOut: `2024-03-${String(18 + i).padStart(2, '0')}`,
      status: ['confirmed', 'pending', 'completed', 'cancelled'][i % 4],
      amount: Math.floor(Math.random() * 1500) + 500,
      guests: Math.floor(Math.random() * 4) + 1,
      nights: Math.floor(Math.random() * 7) + 2,
      avatarColor: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500'][i % 4]
    }));
  };

  const getMockMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      revenue: Math.floor(Math.random() * 15000) + 5000,
      bookings: Math.floor(Math.random() * 30) + 10,
      occupancy: Math.floor(Math.random() * 30) + 65
    }));
  };

  const getMockTopListings = () => {
    return [
      { id: 1, title: 'Modern Downtown Loft', revenue: 12500, bookings: 28, occupancy: 92, rating: 4.8 },
      { id: 2, title: 'Cozy Mountain Cabin', revenue: 9800, bookings: 22, occupancy: 85, rating: 4.9 },
      { id: 3, title: 'Beachfront Villa', revenue: 15200, bookings: 32, occupancy: 88, rating: 4.7 },
    ];
  };

  const getMockTasks = () => {
    return [
      { id: 1, title: 'Update photos for Downtown Loft', date: 'Tomorrow', listing: 'Modern Downtown Loft', priority: 'high' },
      { id: 2, title: 'Schedule deep cleaning', date: 'March 25', listing: 'Cozy Mountain Cabin', priority: 'medium' },
      { id: 3, title: 'Restock amenities', date: 'March 26', listing: 'Beachfront Villa', priority: 'medium' },
    ];
  };

  const getMockReviews = () => {
    return [
      {
        id: '1',
        guestName: 'Alex Johnson',
        listingTitle: 'Modern Downtown Loft',
        rating: 4.8,
        comment: 'Great location and amazing views! The apartment was clean and had everything we needed.',
        stayDate: '2024-01-15',
        createdAt: '2024-01-20T10:30:00Z',
        aspects: { cleanliness: 5, communication: 4, location: 5, value: 4.5 },
        tripType: 'Business',
        hostResponse: null,
        respondedAt: null,
        markedHelpful: null
      },
      {
        id: '2',
        guestName: 'Sarah Williams',
        listingTitle: 'Cozy Mountain Cabin',
        rating: 5.0,
        comment: 'Absolutely perfect! The cabin was even better than the photos.',
        stayDate: '2024-01-10',
        createdAt: '2024-01-18T14:20:00Z',
        aspects: { cleanliness: 5, communication: 5, location: 5, value: 5 },
        tripType: 'Vacation',
        hostResponse: 'Thank you Sarah! We\'re so glad you enjoyed your stay.',
        respondedAt: '2024-01-19T09:15:00Z',
        markedHelpful: true
      },
      {
        id: '3',
        guestName: 'Michael Chen',
        listingTitle: 'Modern Downtown Loft',
        rating: 3.5,
        comment: 'Good location but the WiFi was spotty. Could use some updates in the kitchen.',
        stayDate: '2024-01-05',
        createdAt: '2024-01-12T16:45:00Z',
        aspects: { cleanliness: 4, communication: 3, location: 5, value: 3 },
        tripType: 'Business',
        hostResponse: 'Thank you for your feedback Michael. We\'ve addressed the WiFi issue.',
        respondedAt: '2024-01-13T11:30:00Z',
        markedHelpful: true
      }
    ];
  };

  const calculateReviewStats = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) return;

    const total = reviewsData.length;
    const sumRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const average = total > 0 ? sumRating / total : 0;
    const respondedCount = reviewsData.filter(review => review.hostResponse).length;
    const positiveCount = reviewsData.filter(review => review.rating >= 4).length;
    const negativeCount = reviewsData.filter(review => review.rating <= 2).length;

    const reviewsByRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const roundedRating = Math.round(review.rating);
      reviewsByRating[roundedRating] = (reviewsByRating[roundedRating] || 0) + 1;
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentReviews = reviewsData.filter(r => {
      const reviewDate = new Date(r.createdAt);
      return reviewDate > weekAgo;
    }).length;

    setReviewStats({
      totalReviews: total,
      averageRating: average,
      responseRate: total > 0 ? (respondedCount / total) * 100 : 0,
      recentReviews: recentReviews,
      positiveReviews: positiveCount,
      negativeReviews: negativeCount,
      reviewsByRating,
    });
  };

  // Default stats for fallback
  const getDefaultStats = () => ({
    totalBookings: 156,
    activeBookings: 8,
    cancelledBookings: 12,
    totalEarnings: 125000,
    monthlyEarnings: 15420,
    occupancyRate: 87,
    averageRating: 4.8,
    listingsCount: 3,
    responseRate: 95,
    repeatGuests: 42,
    peakSeasonRate: 450,
    cleaningFees: 3200,
    maintenanceCost: 1800,
    netProfit: 102400,
    guestSatisfaction: 94,
    bookingGrowth: 15,
    revenueGrowth: 22,
    cancellationRate: 8,
  });

  // Booking pagination logic
  const totalBookings = dashboard.recentBookings.length;
  const totalBookingPages = Math.ceil(totalBookings / bookingsPerPage);
  const paginatedBookings = dashboard.recentBookings.slice(
    (currentBookingPage - 1) * bookingsPerPage,
    currentBookingPage * bookingsPerPage
  );

  const handleNextBookingPage = () => {
    if (currentBookingPage < totalBookingPages) {
      setCurrentBookingPage(currentBookingPage + 1);
    }
  };

  const handlePrevBookingPage = () => {
    if (currentBookingPage > 1) {
      setCurrentBookingPage(currentBookingPage - 1);
    }
  };

  // Chart data
  const revenueChartData = dashboard.monthlyData.slice(0, 6);
  const occupancyChartData = dashboard.monthlyData.slice(0, 6).map(item => ({
    month: item.month,
    occupancy: item.occupancy
  }));

  const ratingDistributionData = [
    { name: '5 Stars', value: reviewStats.reviewsByRating[5], color: '#10b981' },
    { name: '4 Stars', value: reviewStats.reviewsByRating[4], color: '#3b82f6' },
    { name: '3 Stars', value: reviewStats.reviewsByRating[3], color: '#f59e0b' },
    { name: '2 Stars', value: reviewStats.reviewsByRating[2], color: '#ef4444' },
    { name: '1 Star', value: reviewStats.reviewsByRating[1], color: '#8b5cf6' },
  ];

  // Components
  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    isCurrency = false,
    trend = "up",
    subtitle,
    gradient = "from-blue-500 to-blue-600",
    prefix = "",
    suffix = "",
  }) => {
    const trendColors = {
      up: { text: "text-green-600", bg: "bg-green-100", icon: ArrowUpRight },
      down: { text: "text-red-600", bg: "bg-red-100", icon: ArrowDownRight },
      neutral: { text: "text-gray-600", bg: "bg-gray-100", icon: TrendingUpIcon },
    };

    const TrendIcon = trendColors[trend]?.icon || ArrowUpRight;

    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-12 translate-x-12`}></div>
          <div className="flex items-start justify-between mb-6">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${trendColors[trend].bg} ${trendColors[trend].text} font-medium text-sm`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {prefix}
                {isCurrency ? "$" : ""}
                {typeof value === "number" ? value.toLocaleString() : value}
                {suffix}
              </span>
              {isCurrency && <span className="text-sm text-gray-500 font-medium">USD</span>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          {title.includes("Rate") && !title.includes("Response") && typeof value === "number" && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{value}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BookingStatusBadge = ({ status }) => {
    const styles = {
      confirmed: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200",
      pending: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
      cancelled: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200",
      completed: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </span>
    );
  };

  const ReviewCard = ({ review }) => (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
            {review.guestName?.charAt(0) || "G"}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{review.guestName}</h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(review.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{review.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-gray-700 mb-4">{review.comment}</p>
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">{review.listingTitle}</span>
        {!review.hostResponse ? (
          <button
            onClick={() => {
              setSelectedReview(review);
              setReviewsView("individual");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reply to Review
          </button>
        ) : (
          <span className="text-sm text-green-600 font-medium">✓ Responded</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute user={user} role="HOST">
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = dashboard.stats || getDefaultStats();

  return (
    <ProtectedRoute user={user} role="HOST">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Host Dashboard
                </h1>
                <p className="text-gray-600 text-sm">
                  {activeTab === "overview" ? "Manage your hosting business" : "Reviews Management"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {activeTab === "overview" && (
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Reviews</span>
                    {reviewStats.totalReviews > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {reviewStats.totalReviews}
                      </span>
                    )}
                  </button>
                )}
                {activeTab === "reviews" && (
                  <button
                    onClick={() => setActiveTab("overview")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mt-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === "reviews"
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews
                {reviewStats.totalReviews > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {reviewStats.totalReviews}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          {activeTab === "overview" ? (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {timeOfDay === "morning"
                          ? "🌅 Good morning"
                          : timeOfDay === "afternoon"
                          ? "☀️ Good afternoon"
                          : "🌙 Good evening"}
                        , Host!
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Here's what's happening with your business today
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg">
                        <Star className="w-4 h-4" />
                        <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-semibold">{stats.responseRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Monthly Revenue"
                  value={stats.monthlyEarnings}
                  icon={DollarSign}
                  change={stats.revenueGrowth}
                  isCurrency={true}
                  trend={stats.revenueGrowth >= 0 ? "up" : "down"}
                  subtitle="Compared to last month"
                  gradient="from-emerald-500 to-teal-600"
                />

                <StatCard
                  title="Occupancy Rate"
                  value={stats.occupancyRate}
                  icon={Activity}
                  change={8}
                  trend="up"
                  subtitle="88% target this month"
                  gradient="from-blue-500 to-cyan-600"
                  suffix="%"
                />

                <StatCard
                  title="Active Bookings"
                  value={stats.activeBookings}
                  icon={CalendarDays}
                  change={stats.bookingGrowth}
                  trend="up"
                  subtitle="Currently checked-in"
                  gradient="from-purple-500 to-violet-600"
                />

                <StatCard
                  title="Guest Rating"
                  value={stats.averageRating}
                  icon={Star}
                  change={2}
                  trend="up"
                  subtitle={`Based on ${reviewStats.totalReviews} reviews`}
                  gradient="from-amber-500 to-orange-600"
                  prefix="★ "
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                      <p className="text-gray-600">Last 6 months performance</p>
                    </div>
                    <DollarSign className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Occupancy Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Occupancy Rate</h3>
                      <p className="text-gray-600">Monthly occupancy percentage</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={occupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
                        <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Bookings with Pagination */}
              {dashboard.recentBookings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                        <p className="text-gray-600">Latest reservations and updates</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        Showing {(currentBookingPage - 1) * bookingsPerPage + 1} to {Math.min(currentBookingPage * bookingsPerPage, totalBookings)} of {totalBookings} bookings
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                          <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stay Details</th>
                          <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${booking.avatarColor} flex items-center justify-center text-white font-medium`}>
                                  {booking.guestName?.charAt(0) || "G"}
                                </div>
                                <div>
                                  <p className="font-medium">{booking.guestName}</p>
                                  <p className="text-sm text-gray-500">
                                    {booking.guests || 1} guest{booking.guests > 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium">{booking.listing}</p>
                                <p className="text-sm text-gray-500">
                                  {booking.checkIn} → {booking.checkOut} ({booking.nights || 1} nights)
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <BookingStatusBadge status={booking.status} />
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-gray-900">${booking.amount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">
                                  ${(booking.amount / (booking.nights || 1)).toFixed(2)}/night
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="View Details">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition" title="More Options">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalBookingPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={handlePrevBookingPage}
                        disabled={currentBookingPage === 1}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          currentBookingPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalBookingPages) }, (_, i) => {
                          let pageNum;
                          if (totalBookingPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentBookingPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentBookingPage >= totalBookingPages - 2) {
                            pageNum = totalBookingPages - 4 + i;
                          } else {
                            pageNum = currentBookingPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentBookingPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                currentBookingPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
  onClick={handleNextBookingPage}
  disabled={currentBookingPage === totalBookingPages}
  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
    currentBookingPage === totalBookingPages
      ? 'text-gray-400 cursor-not-allowed'
      : 'text-gray-600 hover:bg-gray-100'
  }`}
>
  Next
  <ChevronRightIcon className="w-4 h-4" />
</button>
</div>
)}
</div>
)}

          {/* Rating Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Rating Distribution</h3>
                  <p className="text-gray-600">Breakdown of guest ratings</p>
                </div>
                <Star className="w-6 h-6 text-gray-400" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={Object.entries(reviewStats.reviewsByRating).map(([rating, count]) => ({
                    rating: `${rating} Stars`,
                    count
                  })).filter(item => item.count > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="rating" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip formatter={(value) => [value, 'Reviews']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {Object.entries(reviewStats.reviewsByRating).map(([rating], index) => (
                        <Cell key={rating} fill={ratingDistributionData[index]?.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Review Summary</h3>
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Average Rating</span>
                  <span className="font-bold text-blue-600">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Response Rate</span>
                  <span className="font-bold text-green-600">
                    {reviewStats.responseRate.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="text-gray-700">Pending Responses</span>
                  <span className="font-bold text-amber-600">
                    {reviews.filter(r => !r.hostResponse).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Positive Reviews</span>
                  <span className="font-bold text-purple-600">
                    {reviewStats.positiveReviews}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Top Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <Zap className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="block p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition text-center font-medium"
                >
                  Respond to Reviews
                </button>
                <a
                  href="/host/listings/new"
                  className="block p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center font-medium"
                >
                  + Create New Listing
                </a>
                <a
                  href="/host/dashboard/calendar"
                  className="block p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center font-medium"
                >
                  View Calendar
                </a>
              </div>
            </div>

            {/* Top Listings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Top Performing Listings</h3>
                  <p className="text-gray-600">Your best performing properties</p>
                </div>
                <Building className="w-6 h-6 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboard.topListings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Home className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{listing.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue</span>
                        <span className="font-semibold">${listing.revenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bookings</span>
                        <span className="font-semibold">{listing.bookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Occupancy</span>
                        <span className="font-semibold">{listing.occupancy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        // Reviews Tab Content
        <div className="space-y-8">
          {/* Reviews Header with Stats */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
                <p className="text-gray-600">Manage and respond to guest reviews</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Review Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <Star className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Average Rating</h3>
                <p className="text-sm text-gray-600">
                  Based on {reviewStats.totalReviews} reviews
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {reviewStats.responseRate.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Response Rate</h3>
                <p className="text-sm text-gray-600">
                  {reviews.filter(r => r.hostResponse).length} of {reviewStats.totalReviews} responded
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {reviewStats.recentReviews}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Recent Reviews</h3>
                <p className="text-sm text-gray-600">
                  Last 7 days
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {reviewStats.positiveReviews}/{reviewStats.totalReviews}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Positive Reviews</h3>
                <p className="text-sm text-gray-600">
                  4+ star ratings
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">All Reviews</h3>
                  <p className="text-gray-600">
                    Showing {reviews.length} reviews
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewsView(reviewsView === "all" ? "individual" : "all")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Eye className="w-4 h-4" />
                    {reviewsView === "all" ? "Individual View" : "List View"}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Guest reviews will appear here once they leave feedback.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Review Modal */}
      {reviewsView === "individual" && selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReviewsView("all")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Reviews
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setReviewsView("all");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Review Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl">
                          {selectedReview.guestName?.charAt(0) || "G"}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{selectedReview.guestName}</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < Math.floor(selectedReview.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-gray-600 font-medium">
                              {selectedReview.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stay Date</p>
                        <p className="font-medium">
                          {new Date(selectedReview.stayDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-gray-700 text-lg leading-relaxed">{selectedReview.comment}</p>
                    </div>

                    {/* Review Aspects */}
                    {selectedReview.aspects && (
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        {Object.entries(selectedReview.aspects).map(([aspect, rating]) => (
                          <div key={aspect} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <span className="capitalize text-gray-700">{aspect}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{rating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Host Response */}
                  {selectedReview.hostResponse ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Your Response</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedReview.respondedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700">{selectedReview.hostResponse}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setReplyText(selectedReview.hostResponse);
                            toast.success("Edit mode enabled");
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Response
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete your response?")) {
                              try {
                                await api.delete(`/api/reviews/${selectedReview.id}/response`);
                                toast.success("Response deleted");
                                setSelectedReview({
                                  ...selectedReview,
                                  hostResponse: null,
                                  respondedAt: null,
                                });
                              } catch (error) {
                                toast.error("Failed to delete response");
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete Response
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                      <div className="text-center mb-4">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-2">No Response Yet</h4>
                        <p className="text-gray-600">Respond to this review to show you care about guest feedback</p>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response here... Be professional and appreciative."
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setReplyText("");
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!replyText.trim()) {
                              toast.error("Please enter a response");
                              return;
                            }
                            try {
                              await api.post(`/api/reviews/${selectedReview.id}/respond`, {
                                response: replyText,
                              });
                              toast.success("Response sent successfully");
                              setSelectedReview({
                                ...selectedReview,
                                hostResponse: replyText,
                                respondedAt: new Date().toISOString(),
                              });
                              setReplyText("");
                            } catch (error) {
                              toast.error("Failed to send response");
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Review Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          toast.success("Marked as helpful");
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border ${
                          selectedReview.markedHelpful
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span>Mark as Helpful</span>
                      </button>
                      <button
                        onClick={() => {
                          toast.success("Review reported for moderation");
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <Flag className="w-5 h-5 text-gray-600" />
                        <span>Report Review</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Overall Rating</span>
                        <span className="font-semibold">{selectedReview.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Trip Type</span>
                        <span className="font-semibold">{selectedReview.tripType || "Leisure"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Reviewed</span>
                        <span className="font-semibold">
                          {new Date(selectedReview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReview.hostResponse
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {selectedReview.hostResponse ? "Responded" : "Pending Response"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

    {/* Footer */}
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} Host Dashboard. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</ProtectedRoute>
);}