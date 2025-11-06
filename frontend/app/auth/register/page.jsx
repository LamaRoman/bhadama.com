"use client";
import { useState } from "react";

export default function RegisterPage(){
    const [formData,setFormData] = useState({
        name:"",
        email:"",
        password:"",
        role: "USER"
    })

    const [message,setMessage] = useState("")

    const handleChange = (e) => {
        setFormData({...formData,[e.target.name]:e.target.value});
    }

    const handleSubmit = async(e)=>{
        e.preventDefault();
        try{
            const res = await fetch("http://localhost:5001/api/auth/register",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(formData),
            });

            const data = await res.json();
            if(res.ok){
                localStorage.setItem("token",data.token);
                setMessage("Registered successfully!")
            }else{
                setMessage(data.message || "Registration failed");
            }
        }catch(error){}
    };
    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Register</h1>
            <form onSubmit={handleSubmit} className="flex flex-col w-80 gap-3">
                <input type="text" name="name" placeholder="Name" onChange={handleChange} required/>
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required/>
                <input type="password" name="password" placeholder="Password" onChange={handleChange}/>
                <button className="bg-lama text-white py-2 rounded">Register</button>
            </form>
            {message && <p className="mt-3">{message}</p>}
        </div>
    )
}