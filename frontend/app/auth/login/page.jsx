"use client";
import { api } from "../../utils/api.js";
import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth.js"
export default function LoginPage(){
    const {login} = useAuth();
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [error,setError]=useState("");

    const handleSubmit = async(e)=>{
        e.preventDefault();
        try{
            const data = await api("/api/auth/login",{
                method:"POST",
                body: JSON.stringify({email,password})
            });
            console.log("Response from backend:", data);
            login(data.user,data.token);
            
        }catch(error){
            console.log(error);
            setError("server error");
        }
    };

    return(
        <div className="flex justify-center items-center h-screen">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4">Login</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    <input 
                        type="email"
                        placeholder="Email"
                        className="border p-2 w-full mb-3"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="border p-2 w-full mb-3"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                    />

            <button type="submit" className="bg-lama w-full p-2 text-white">Login</button>

            </form>
        </div>
    )
}