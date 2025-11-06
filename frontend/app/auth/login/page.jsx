"use client";
import { useEffect } from "react";
import { useState } from "react";

export default function LoginPage(){
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [message,setMessage]=useState("");

    const handleSubmit = async(e)=>{
        e.preventDefault();
        try{
            const res = await fetch("http://localhost:5001/api/auth/login",{
                method:"POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({email,password})
            })
            const data = await res.json();

            if(res.ok){
                localStorage.setItem("token",data.token);
                setMessage("Login successful")
            }else{
                setMessage(data.message || "Invalid credentials")
            }
        }catch(error){
            setMessage("server error");
        }
    };

    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col w-80 gap-3">
            <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
            <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
            <button className="bg-lama text-white py-2 rounded"> Login </button>
        </form>

        {message && <p className="mt-3">{message}</p>}
        </div>
    )
}