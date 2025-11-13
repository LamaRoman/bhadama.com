"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api";

export default function HostDashboard(){
    const router = useRouter();
    const [message,setMessage] = useState("");

    useEffect(()=>{
        const fetchDashboard = async () =>{
            if(data.message) setMessage(data.message);
            else router.push("/auth/login") //redirect if not authorized
        };

        fetchDashboard();
    },[]);

    return(
        <div className="p-4">
            <h1 className="text-2xl font-bold">Host Dashboard</h1>
            <p>{message || "Loading..."}</p>
        </div>
    )
}