"use client";
import { useEffect,useState } from "react";
import {useRouter} from "next/navigation";
import { api } from "../../utils/api";
export default function ProfilePage(){
    const [user,setUser] = useState(null);
    const router = useRouter();
    useEffect(()=>{
        const token = localStorage.getItem("token");
        if(!token) return router.push("/auth/login");// redirect if no token

            const fetchProfile = async ()=>{
                const data = await api("/api/users/profile");
                if(data.user) setUser(data.user);
                else router.push("/auth/login");
            }
            
        fetchProfile();
    },[]);
    if(!user) return <p>Loading profile...</p>

    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}</h1>
            <p>Email:{user.email}</p>
            <p>Role:{user.role}</p>

            <button className="bg-red-500 text-white mt-6 px-4 py-2 rounded"
                onClick={()=>{
                    localStorage.removeItem("token");
                    router.push("/auth/login")
                }}>
                    Logout
            </button>
        </div>
    )
}
