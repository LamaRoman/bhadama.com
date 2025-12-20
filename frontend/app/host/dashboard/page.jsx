"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute";

import { useAuth } from "../../contexts/AuthContext";
export default function HostDashboard() {

  const { user } = useAuth();

  return (
    <ProtectedRoute user={user} role="HOST">
      <div>
        <main className="p-10">
          <h1 className="text-2xl font-bold">Host Dashboard</h1>
          <p>Welcome, {user?.name}</p>

          <div className="mt-6">
            <a
              href="/host/listings/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              + Create New Listing
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <a
              href="/host/dashboard/bookings"
              className="border p-4 rounded shadow hover:scale-105 transition"
            >
              Bookings
            </a>

            <a
              href="/host/dashboard/earnings"
              className="border p-4 rounded shadow hover:scale-105 transition"
            >
              Earnings
            </a>

            <a
              href="/host/dashboard/analytics"
              className="border p-4 rounded shadow hover:scale-105 transition"
            >
              Analytics
            </a>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
