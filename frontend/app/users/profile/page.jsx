"use client";
import { useEffect,useState } from "react";

export default function ProfilePage(){
    const [user,setUser] = useState(null);

    useEffect(()=>{
const fetchProfile = async() =>{
        const token = localStorage.getItem("token");
        if(!token) return console.log("No token found")
         
            const res = await fetch("http://localhost:5001/api/users/profile",{
                headers:{
                Authorization: `Bearer ${token}`,
                }
            }) 
            
            const data = await res.json();
            if(res.ok){
                setUser(data.user);
            }else{
                console.log(data.message);
            }
        };
        fetchProfile();
    },[]);
    if(!user) return <p>Loading profile...</p>

    return(
        <div className="p-4">
            <h1 className="text-xl font-semibold">Welcome, {user.username}</h1>
            <p>Email:{user.email}</p>
            <p>Role:{user.role}</p>
        </div>
    )
}
