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
        </main>
      </div>
    </ProtectedRoute>
  );
}
