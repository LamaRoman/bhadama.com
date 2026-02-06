// app/users/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api.js";
import UserBookings from "../../../components/UserBookings.jsx";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "upcoming", "completed", "cancelled"
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Only run the data fetching if we're on the client side and mounted
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check for token on client side
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        // Fetch user profile
        const profileData = await api("/api/users/profile");
        if (profileData.error) {
          console.error("Profile fetch error:", profileData.error);
          localStorage.removeItem("token");
          router.push("/");
          return;
        }
        setUser(profileData);

        // Fetch user bookings
        const bookingsData = await api("/api/bookings");
        console.log("Bookings data:", bookingsData);
        
        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData);
        } else if (bookingsData?.bookings) {
          setBookings(bookingsData.bookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        localStorage.removeItem("token");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter bookings based on activeFilter
  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.bookingDate) > now && b.status !== "CANCELLED");
  const completedBookings = bookings.filter(b => new Date(b.bookingDate) < now && b.status !== "CANCELLED");
  const cancelledBookings = bookings.filter(b => b.status === "CANCELLED");

  // Filtered bookings to display
  const filteredBookings = {
    all: bookings,
    upcoming: upcomingBookings,
    completed: completedBookings,
    cancelled: cancelledBookings
  }[activeFilter];

  // Get next upcoming booking
  const nextBooking = upcomingBookings.length > 0 
    ? [...upcomingBookings].sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))[0]
    : null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

 // In your dashboard page, update the handleLeaveReview function:
const handleLeaveReview = (bookingId, listingId) => {
  if (!user) {
    // Show a toast notification
    alert("Please login to leave a review");
    router.push(`/auth/login?redirect=/users/dashboard`);
    return;
  }

  // Redirect to the new review page with bookingId
  router.push(`/reviews/new/${listingId}?bookingId=${bookingId}`);
};

  // Show loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user data after loading, show error
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-4">
            Unable to load dashboard
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] || "Guest"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your bookings and explore new spaces
          </p>
        </div>

        {/* Quick Stats - Now Clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveFilter("all")}
            className={`text-left bg-white border ${activeFilter === "all" ? "border-blue-300 shadow-lg" : "border-gray-200"} rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
              <div className={`w-10 h-10 ${activeFilter === "all" ? "bg-blue-100" : "bg-gray-100"} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${activeFilter === "all" ? "text-blue-600" : "text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold ${activeFilter === "all" ? "text-blue-600" : "text-gray-900"}`}>{bookings.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              All-time bookings made
            </p>
          </button>

          <button
            onClick={() => setActiveFilter("upcoming")}
            className={`text-left bg-white border ${activeFilter === "upcoming" ? "border-blue-300 shadow-lg" : "border-gray-200"} rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Upcoming</p>
              <div className={`w-10 h-10 ${activeFilter === "upcoming" ? "bg-blue-100" : "bg-blue-50"} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${activeFilter === "upcoming" ? "text-blue-600" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold ${activeFilter === "upcoming" ? "text-blue-600" : "text-blue-600"}`}>{upcomingBookings.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              Future bookings scheduled
            </p>
          </button>

          <button
            onClick={() => setActiveFilter("completed")}
            className={`text-left bg-white border ${activeFilter === "completed" ? "border-green-300 shadow-lg" : "border-gray-200"} rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Completed</p>
              <div className={`w-10 h-10 ${activeFilter === "completed" ? "bg-green-100" : "bg-green-50"} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${activeFilter === "completed" ? "text-green-600" : "text-green-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold ${activeFilter === "completed" ? "text-green-600" : "text-green-600"}`}>{completedBookings.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              Click to view and leave reviews
            </p>
          </button>
        </div>

        {/* Active Filter Badge */}
        {activeFilter !== "all" && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-600">Showing:</span>
              <span className="text-sm font-medium capitalize">
                {activeFilter} bookings ({filteredBookings.length})
              </span>
              <button
                onClick={() => setActiveFilter("all")}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Next Booking Highlight */}
        {nextBooking && activeFilter === "all" && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Next Booking</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {nextBooking.listing?.title || "Upcoming Booking"}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(nextBooking.bookingDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(nextBooking.startTime)} - {formatTime(nextBooking.endTime)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {nextBooking.guests} guest{nextBooking.guests !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push(`/bookings/${nextBooking.id}`)}
                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push("/public/listings")}
                    className="px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Book Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Bookings (if any) */}
        {upcomingBookings.length > 0 && activeFilter === "all" && (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h2>
                  <p className="text-gray-600 mt-1">
                    {upcomingBookings.length} booking{upcomingBookings.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <button
                  onClick={() => setActiveFilter("upcoming")}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors group"
                >
                  View All Upcoming
                  <svg 
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {booking.listing?.title || "Booking"}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(booking.bookingDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-medium">
                          ${Number(booking.totalPrice).toFixed(2)}
                        </span>
                        <button
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {upcomingBookings.length > 3 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveFilter("upcoming")}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View all {upcomingBookings.length} upcoming bookings ↓
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Bookings Section */}
        <div id="all-bookings" className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeFilter === "all" ? "All Bookings" : `${activeFilter} Bookings`}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeFilter === "completed" 
                  ? "View completed bookings and leave reviews" 
                  : "View and manage all your bookings"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === "all" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-gray-50 text-gray-800 hover:bg-gray-100"}`}
                >
                  {bookings.length} All
                </button>
                <button
                  onClick={() => setActiveFilter("upcoming")}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === "upcoming" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-blue-50 text-blue-800 hover:bg-blue-100"}`}
                >
                  {upcomingBookings.length} Upcoming
                </button>
                <button
                  onClick={() => setActiveFilter("completed")}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === "completed" ? "bg-green-100 text-green-800 border border-green-200" : "bg-green-50 text-green-800 hover:bg-green-100"}`}
                >
                  {completedBookings.length} Completed
                </button>
                {cancelledBookings.length > 0 && (
                  <button
                    onClick={() => setActiveFilter("cancelled")}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === "cancelled" ? "bg-gray-100 text-gray-800 border border-gray-200" : "bg-gray-50 text-gray-800 hover:bg-gray-100"}`}
                  >
                    {cancelledBookings.length} Cancelled
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeFilter === "completed" ? "No completed bookings" : "No bookings yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFilter === "completed" 
                  ? "You don't have any completed bookings yet."
                  : "Start exploring amazing yards and make your first booking."}
              </p>
              <button
                onClick={() => router.push("/public/listings")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Listings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFilter === "completed" ? (
                // Special view for completed bookings with review buttons
                filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.listing?.title || "Booking"}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {booking.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Date</p>
                              <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Time</p>
                              <p className="font-medium">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Guests</p>
                              <p className="font-medium">{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-xl font-bold text-gray-900">
                              ${Number(booking.totalPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                        
                       {/* In the completed bookings section */}
{booking.listing?.id && (
  <button
    onClick={() => handleLeaveReview(booking.id, booking.listing.id)}
    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
  >
    Leave a Review
  </button>
)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Regular UserBookings component for other filters
                <UserBookings bookings={filteredBookings} setBookings={setBookings} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}