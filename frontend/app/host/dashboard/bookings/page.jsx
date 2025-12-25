"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../contexts/AuthContext.js";
import Navbar from "../../../../components/Navbar";

export default function BookingsPage(){
    const {user} = useAuth();

    return(
          <ProtectedRoute user={user} role="HOST">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="mt-2 text-gray-700">Here you can view all your bookings.</p>

          {/* Placeholder for bookings list */}
          <div className="mt-6 border p-4 rounded text-gray-500">
            No bookings yet.
          </div>
        </main>
      </div>
    </ProtectedRoute>
    )
}