"use client";
import Navbar from "../../../components/Navbar.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute user={user} role="ADMIN">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p>Welcome, {user?.name}!</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="border p-4 rounded">Users</div>
            <div className="border p-4 rounded">Hosts</div>
            <div className="border p-4 rounded">Listings</div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
