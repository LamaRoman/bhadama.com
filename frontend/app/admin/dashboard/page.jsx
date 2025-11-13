"use client";

import { useEffect, useState } from "react";
import {useRouter} from "next/navigation";
import {api} from "../../utils/api";

export default function AdminDashboard(){
    const router = useRouter();
    const [message,setMessage] = useState("");

    useEffect(()=>{
        const token = localStorage.getItem("token");
        if(!token) return router.push("/auth/login");

        const fetchAdmin = async ()=>{
            const data = await api("/api/admin/dashboard");

            if(data.message) setMessage(data.message);
            else router.push("/auth/login")
        }
        fetchAdmin();
    },[]);

    if(!message) return <p className="text-center mt-10">Loading...</p>;

    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold text-lama mb-4">Admin Dashboard</h1>
            <p>{message}</p>
            <button
            className="mt-6 bg-red-500 text-while px-4 py-2 rounded"
            onClick={()=>{
                localStorage.removeItem("token");
                router.push("/auth/login");
            }}
            >Logout</button>
        </div>
    )
}