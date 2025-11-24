"use client";

import { useEffect,useState } from "react";
import Navbar from "../../../components/Navbar";
import {api} from "../../utils/api.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { useAuth } from "../../../hooks/useAuth";

export default function AdminHosts(){
    const {user} = useAuth();
    const [hosts,setHosts] = useState([]);

    const fetchHosts = async ()=>{
        try{
            const data = await api("/admin/hosts");
            setHosts(data);
        }catch(err){
            console.error(err);
            setHosts([]);
        }
    };

    useEffect(()=>{
        fetchHosts();
    },[]);

    return(
        <ProtectedRoute user={user} role={ADMIN}>
            <Navbar/>

            <main className="p-10">
                <h1 className="text-xl font-bold">All Hosts</h1>

                <div className="mt-6 space-y-4">
                    {hosts.map((h)=>{
                        <div key={h.id} className="border p-4 rounded">
                            <h2 className="font-bold">{h.name}</h2>
                            <p>{h.email}</p>
                        </div>
                    })}
                </div>
            </main>
        </ProtectedRoute>
    )
}