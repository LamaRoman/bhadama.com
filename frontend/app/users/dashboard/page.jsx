"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api.js";
import UserBookings from "../../../components/UserBookings.jsx";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/auth/login");

    const fetchData = async () => {
      try {
        // Fetch user info (optional if stored in login)
        const profileData = await api("/api/users");
        if (profileData.user) setUser(profileData.user);

        // Fetch user bookings
        const bookingsData = await api("/api/userBookings/bookings");
        setBookings(Array.isArray(bookingsData.bookings) ? bookingsData.bookings : []);
      } catch (err) {
        console.error("Booking problem"+err);
        router.push("/auth/login");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Top Header Card */}
      {user && (
        <div className="bg-white shadow rounded-lg p-5 flex justify-between items-center mb-8">
          <div>
            <p className="text-lg font-semibold text-gray-800">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => router.push("/users/profile")}
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Bookings Section */}
      <div className="bg-white shadow rounded-lg p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <UserBookings bookings={bookings} setBookings={setBookings} />
        )}
      </div>
    </div>
  );
}
