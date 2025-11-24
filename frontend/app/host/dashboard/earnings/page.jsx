"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../hooks/useAuth";
import Navbar from "../../../../components/Navbar";

export default function BookingsPage(){
    const {user} = useAuth();

    return(
          <ProtectedRoute user={user} role="HOST">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="mt-2 text-gray-700">Track your earnings here.</p>

          {/* Placeholder for earnings chart or summary */}
          <div className="mt-6 border p-4 rounded text-gray-500">
            Earnings data will appear here.
          </div>
        </main>
      </div>
    </ProtectedRoute>
    )
}