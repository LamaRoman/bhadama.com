"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";
import Navbar
 from "../../../components/Navbar";
import { useEffect, useState } from "react";
export default function HostDashboard(){
    const { user } = useAuth();
    const [earnings,setEarnings] = useState(0);

    useEffect(()=>{
      const fetchEarnings = async ()=>{
        try{
          const data = await api("/host/earnings");
          setEarnings(data.total || 0);
        }catch (err){
          console.error(err);
          setEarnings(0)
        }
      };
      fetchEarnings();
    },[])

    return(
        <ProtectedRoute user={user} role="HOST">
            <div> 
                <Navbar/>
                <main className="p-10">
                    <h1 className="text-2xl font-bold">Earnings</h1>
                    <p>Total earnings: ${earnings}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    

          
                </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}