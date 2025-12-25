"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api.js";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// Optimized icon imports
import {
  DollarSign, TrendingUp, Star, MessageSquare, RefreshCw,
  Eye, MoreVertical, CalendarDays, Activity, Building, Home,
  ChevronLeft, ChevronRight, X, BarChart3,
} from "lucide-react";

// Lazy load charts
const DashboardCharts = dynamic(() => import("./components/DashboardCharts"), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {[1, 2].map(i => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
    </div>
  ),
  ssr: false,
});

// ============ CONSTANTS ============
const BOOKINGS_PER_PAGE = 5;

const STATUS_STYLES = {
  confirmed: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200",
  pending: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
  cancelled: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200",
  completed: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200",
};

const GRADIENTS = {
  revenue: "from-emerald-500 to-teal-600",
  occupancy: "from-blue-500 to-cyan-600",
  bookings: "from-purple-500 to-violet-600",
  rating: "from-amber-500 to-orange-600",
};

// ============ UTILITIES ============
const getTimeOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
};

const formatCurrency = (v) => `$${(v || 0).toLocaleString()}`;

const calcReviewStats = (reviews) => {
  if (!reviews?.length) {
    return { totalReviews: 0, averageRating: 0, responseRate: 0, recentReviews: 0, positiveReviews: 0, reviewsByRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
  const total = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const responded = reviews.filter(r => r.hostResponse).length;
  const positive = reviews.filter(r => r.rating >= 4).length;
  const byRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => byRating[Math.round(r.rating)]++);
  const weekAgo = Date.now() - 604800000;
  const recent = reviews.filter(r => new Date(r.createdAt) > weekAgo).length;
  return { totalReviews: total, averageRating: avg, responseRate: (responded / total) * 100 || 0, recentReviews: recent, positiveReviews: positive, reviewsByRating: byRating };
};

// ============ MEMOIZED COMPONENTS ============
const StatCard = memo(({ title, value, icon: Icon, change, isCurrency, trend = "up", subtitle, gradient }) => (
  <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-12 translate-x-12`} />
    <div className="flex items-start justify-between mb-6">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium text-sm ${trend === "up" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>
          <span>{trend === "up" ? "↑" : "↓"} {Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
      {isCurrency ? formatCurrency(value) : value}{title.includes("Rate") && "%"}
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
  </div>
));
StatCard.displayName = "StatCard";

const BookingRow = memo(({ booking }) => (
  <tr className="hover:bg-gray-50/50 transition-colors">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${booking.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white font-medium`}>
          {booking.guestName?.[0] || 'G'}
        </div>
        <div>
          <p className="font-medium">{booking.guestName}</p>
          <p className="text-sm text-gray-500">{booking.guests || 1} guest{(booking.guests || 1) > 1 ? "s" : ""}</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-6">
      <p className="font-medium">{booking.listing}</p>
      <p className="text-sm text-gray-500">{booking.checkIn} → {booking.checkOut}</p>
    </td>
    <td className="py-4 px-6">
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[booking.status] || "bg-gray-100"}`}>
        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
      </span>
    </td>
    <td className="py-4 px-6">
      <p className="font-bold text-gray-900">{formatCurrency(booking.amount)}</p>
      <p className="text-sm text-gray-500">${((booking.amount || 0) / (booking.nights || 1)).toFixed(0)}/night</p>
    </td>
    <td className="py-4 px-6">
      <div className="flex gap-2">
        <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></button>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><MoreVertical className="w-4 h-4" /></button>
      </div>
    </td>
  </tr>
));
BookingRow.displayName = "BookingRow";

const StarRating = memo(({ rating }) => (
  <div className="flex">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`w-4 h-4 ${i <= Math.floor(rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
    ))}
  </div>
));
StarRating.displayName = "StarRating";

const ReviewCard = memo(({ review, onReply }) => (
  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
        {(review.guestName || 'G').charAt(0)}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{review.guestName || 'Guest'}</h4>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          <span className="text-sm text-gray-500">{(review.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <div className="text-right text-sm text-gray-500">
        {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
      </div>
    </div>
    
    <p className="text-gray-700 mb-4">{review.comment || 'No comment provided'}</p>
    
    {/* Host Response Section */}
    {review.hostResponse && (
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm">Host Response</span>
            {review.respondedAt && (
              <span className="text-xs text-gray-500 ml-2">
                • {new Date(review.respondedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-700 text-sm pl-10">{review.hostResponse}</p>
      </div>
    )}
    
    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
      <span className="text-sm text-gray-600">{review.listingTitle || 'Listing'}</span>
      {review.hostResponse ? (
        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
          <MessageSquare className="w-4 h-4" /> Responded
        </span>
      ) : (
        <button onClick={() => onReply(review)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          <MessageSquare className="w-4 h-4" /> Reply
        </button>
      )}
    </div>
  </div>
));
ReviewCard.displayName = "ReviewCard";

const Pagination = memo(({ current, total, onChange }) => {
  if (total <= 1) return null;
  const pages = useMemo(() => {
    const start = Math.max(1, current - 2);
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i).filter(p => p <= total);
  }, [current, total]);

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <button onClick={() => onChange(current - 1)} disabled={current === 1}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${current === 1 ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-100'}`}>
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <div className="flex gap-2">
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg ${current === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
        ))}
      </div>
      <button onClick={() => onChange(current + 1)} disabled={current === total}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${current === total ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-100'}`}>
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});
Pagination.displayName = "Pagination";

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

// ============ MAIN COMPONENT ============
export default function HostDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState({ stats: null, recentBookings: [], monthlyData: [], topListings: [] });
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [bookingPage, setBookingPage] = useState(1);

  const timeOfDay = useMemo(getTimeOfDay, []);
  const reviewStats = useMemo(() => calcReviewStats(reviews), [reviews]);
  const totalPages = useMemo(() => Math.ceil(dashboard.recentBookings.length / BOOKINGS_PER_PAGE), [dashboard.recentBookings.length]);
  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    return dashboard.recentBookings.slice(start, start + BOOKINGS_PER_PAGE);
  }, [dashboard.recentBookings, bookingPage]);

  // Auth check and redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        console.log("📊 Fetching dashboard...");
        const [dash, rev] = await Promise.all([
          api("/api/host/dashboard"),
          api("/api/host/reviews").catch((e) => {
            console.log("Reviews fetch failed:", e);
            return { reviews: [] };
          }),
        ]);
        console.log("✅ Dashboard data received:", dash);
        console.log("✅ Reviews data received:", rev);
        
        setDashboard({ 
          stats: dash.stats || {}, 
          recentBookings: dash.recentBookings || [], 
          monthlyData: dash.monthlyData || [], 
          topListings: dash.topListings || [] 
        });
        
        // Map reviews to expected format with better null handling
        const mappedReviews = (rev.reviews || []).map(r => {
          console.log("📝 Mapping review:", r);
          return {
            id: r.id,
            guestName: r.user?.name || r.guestName || 'Guest',
            listingTitle: r.listing?.title || r.listingTitle || 'Listing',
            rating: r.rating || 0,
            comment: r.comment || r.text || '',
            createdAt: r.createdAt,
            hostResponse: r.hostResponse || r.response || null,
            respondedAt: r.respondedAt,
          };
        });
        console.log("✅ Mapped reviews:", mappedReviews);
        setReviews(mappedReviews);
      } catch (e) {
        console.error("❌ Fetch error:", e);
        toast.error("Failed to load dashboard");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  const handleReply = useCallback((r) => { setSelectedReview(r); setReplyText(""); }, []);
  
  const sendReply = useCallback(async () => {
    if (!replyText.trim()) return toast.error("Enter a response");
    
    console.log("📤 Sending reply to review:", selectedReview.id);
    console.log("📤 Reply text:", replyText);
    
    try {
      const result = await api(`/api/host/reviews/${selectedReview.id}/reply`, { 
        method: 'POST', 
        body: { response: replyText } 
      });
      
      console.log("✅ Reply sent successfully:", result);
      toast.success("Response sent successfully! 🎉");
      
      setReviews(prev => prev.map(r => 
        r.id === selectedReview.id 
          ? { ...r, hostResponse: replyText, respondedAt: new Date().toISOString() } 
          : r
      ));
      setSelectedReview(null);
      setReplyText("");
    } catch (e) {
      console.error("❌ Reply error:", e);
      console.error("❌ Error message:", e.message);
      toast.error(e.message || "Failed to send response"); 
    }
  }, [replyText, selectedReview]);

  // Loading states
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!user || user.role !== "HOST") {
    return <LoadingSkeleton />;
  }

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  const stats = dashboard.stats || {};
  const greetings = { morning: "🌅 Good morning", afternoon: "☀️ Good afternoon", evening: "🌙 Good evening" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Host Dashboard</h1>
              <p className="text-gray-600 text-sm">{activeTab === "overview" ? "Manage your business" : "Reviews"}</p>
            </div>
            <button onClick={() => location.reload()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <div className="flex border-b border-gray-200 mt-4">
            {["overview", "reviews"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                {tab}{tab === "reviews" && reviewStats.totalReviews > 0 && <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{reviewStats.totalReviews}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "overview" ? (
          <>
            {/* Welcome */}
            <div className="mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{greetings[timeOfDay]}, {user?.name || 'Host'}!</h2>
                  <p className="text-gray-600 mt-2">Here's what's happening today</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg">
                  <Star className="w-4 h-4" /><span className="font-semibold">{(stats.averageRating || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Monthly Revenue" value={stats.monthlyEarnings || 0} icon={DollarSign} change={stats.revenueGrowth} isCurrency trend={(stats.revenueGrowth || 0) >= 0 ? "up" : "down"} subtitle="vs last month" gradient={GRADIENTS.revenue} />
              <StatCard title="Occupancy Rate" value={stats.occupancyRate || 0} icon={Activity} change={8} trend="up" subtitle="Target: 88%" gradient={GRADIENTS.occupancy} />
              <StatCard title="Active Bookings" value={stats.activeBookings || 0} icon={CalendarDays} change={stats.bookingGrowth} trend="up" subtitle="Checked-in" gradient={GRADIENTS.bookings} />
              <StatCard title="Guest Rating" value={stats.averageRating || 0} icon={Star} change={2} trend="up" subtitle={`${reviewStats.totalReviews} reviews`} gradient={GRADIENTS.rating} />
            </div>

            {/* Charts */}
            <DashboardCharts monthlyData={dashboard.monthlyData} reviewStats={reviewStats} reviews={reviews} />

            {/* Bookings */}
            {dashboard.recentBookings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>{["Guest", "Stay", "Status", "Amount", ""].map(h => <th key={h} className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedBookings.map(b => <BookingRow key={b.id} booking={b} />)}
                    </tbody>
                  </table>
                </div>
                <Pagination current={bookingPage} total={totalPages} onChange={setBookingPage} />
              </div>
            )}

            {/* Quick Actions & Top Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => setActiveTab("reviews")} className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg">Respond to Reviews</button>
                  <a href="/host/listings/new" className="block p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center">+ New Listing</a>
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top Listings</h3>
                  <Building className="w-6 h-6 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(dashboard.topListings || []).map(l => (
                    <div key={l.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {l.image ? (
                            <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                          ) : (
                            <Home className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{l.title}</h4>
                          <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /><span className="text-xs text-gray-600">{l.rating}</span></div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span className="font-semibold">${l.revenue}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Occupancy</span><span className="font-semibold">{l.occupancy}%</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Reviews Tab */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Average Rating", value: (reviewStats.averageRating || 0).toFixed(1), icon: Star, bg: "from-blue-50 to-blue-100 border-blue-200", iconColor: "text-blue-600" },
                { label: "Response Rate", value: `${(reviewStats.responseRate || 0).toFixed(0)}%`, icon: MessageSquare, bg: "from-green-50 to-green-100 border-green-200", iconColor: "text-green-600" },
                { label: "Recent Reviews", value: reviewStats.recentReviews || 0, icon: TrendingUp, bg: "from-amber-50 to-amber-100 border-amber-200", iconColor: "text-amber-600" },
                { label: "Positive", value: `${reviewStats.positiveReviews || 0}/${reviewStats.totalReviews || 0}`, icon: BarChart3, bg: "from-purple-50 to-purple-100 border-purple-200", iconColor: "text-purple-600" },
              ].map(({ label, value, icon: Icon, bg, iconColor }) => (
                <div key={label} className={`bg-gradient-to-br ${bg} rounded-xl p-5 border`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${iconColor}`} />
                    <span className="text-2xl font-bold text-gray-900">{value}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">All Reviews</h3>
              <div className="space-y-4">
                {reviews.length ? reviews.map(r => <ReviewCard key={r.id} review={r} onReply={handleReply} />) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Reply to {selectedReview.guestName}</h2>
                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2"><StarRating rating={selectedReview.rating} /><span>{(selectedReview.rating || 0).toFixed(1)}</span></div>
                <p className="text-gray-700">{selectedReview.comment}</p>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Your response..." className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedReview(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={sendReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6 text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} Host Dashboard
        </div>
      </footer>
    </div>
  );
}