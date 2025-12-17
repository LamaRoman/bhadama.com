// app/users/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api.js";
import UserBookings from "../../../components/UserBookings.jsx";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileData = await api("/api/profile");
        console.log("Profile data:", profileData); // DEBUG
        if (profileData.error) {
          router.push("/auth/login");
          return;
        }
        setUser(profileData);

        // Fetch user bookings
        const bookingsData = await api("/api/bookings");
        console.log("Bookings data received:", bookingsData); // DEBUG
        console.log("Is array?", Array.isArray(bookingsData)); // DEBUG
        console.log("Length:", bookingsData?.length); // DEBUG
        
        if (Array.isArray(bookingsData)) {
          console.log("Setting bookings from array"); // DEBUG
          setBookings(bookingsData);
        } else if (bookingsData.bookings) {
          console.log("Setting bookings from .bookings property"); // DEBUG
          setBookings(bookingsData.bookings);
        } else {
          console.log("No bookings found, setting empty array"); // DEBUG
          setBookings([]);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Add this debug log
  console.log("Current bookings state:", bookings);
  console.log("Bookings length:", bookings.length);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* User Info Card */}
        {user && (
          <div className="bg-white shadow rounded-xl p-6 flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
              onClick={() => router.push("/users/profile")}
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow rounded-xl p-5">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-5">
            <p className="text-gray-500 text-sm">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600">
              {bookings.filter((b) => new Date(b.startDate) > new Date()).length}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-5">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {bookings.filter((b) => new Date(b.endDate) < new Date()).length}
            </p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">My Bookings</h2>
            <button
              onClick={() => router.push("/public/listings")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Browse Listings →
            </button>
          </div>

          {/* DEBUG: Show raw bookings data
          <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify({ count: bookings.length, bookings }, null, 2)}</pre>
          </div> */}

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by browsing available listings.
              </p>
              <button
                onClick={() => router.push("/public/listings")}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            <UserBookings bookings={bookings} setBookings={setBookings} />
          )}
        </div>
      </div>
    </div>
  );
}