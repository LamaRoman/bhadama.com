"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";
import Navbar
 from "../../../components/Navbar";
export default function HostDashboard(){
    const { user } = useAuth();

    return(
        <ProtectedRoute user={user} role="HOST">
            <div>
                <Navbar/>
                <main className="p-10">
                    <h1 className="text-2xl font-bold">Host Dashboard</h1>
                    <p>Welcome, {user?.name}</p>
                </main>
            </div>
        </ProtectedRoute>
    )
}