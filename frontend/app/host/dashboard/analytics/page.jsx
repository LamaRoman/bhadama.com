"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../hooks/useAuth";
import Navbar from "../../../../components/Navbar";
import { useEffect } from "react";

export default function BookingsPage(){
    const {user} = useAuth();
    const [stats,setStats] = useState({views:0,bookings:0});

    useEffect(()=>{
      const fetchAnalytics = async () =>{
        try{
          const data = await api("/host/analytics");
          setStats(data);
        }catch(err){
          console.error(err);
          setStats({views:0,bookings:0})
        }
      };
      fetchAnalytics();
    },[]);

    return(
          <ProtectedRoute user={user} role="HOST">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="mt-6 border p-4 rounded text-gray-500">
          <p>Total Views:{stats.views}</p>
          <p>Total Bookings:{stats.bookings}</p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
    )
}