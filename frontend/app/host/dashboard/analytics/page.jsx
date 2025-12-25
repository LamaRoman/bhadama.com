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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-2 text-gray-700">View your listing analytics here.</p>

          {/* Placeholder for analytics charts */}
          <div className="mt-6 border p-4 rounded text-gray-500">
            Analytics charts will appear here.
          </div>
        </main>
      </div>
    </ProtectedRoute>
    )
}