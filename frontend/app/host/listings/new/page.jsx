"use client";
import { useState } from "react";
import Navbar from "../../../../components/protectedRoute.jsx";
import { useAuth } from "../../../../hooks/useAuth.js";
import {api} from "../../../utils/api.js";
import { ProtectedRoute } from "../../../../components/protectedRoute.jsx";

export default function NewListing(){
    const {user} = useAuth();
    const [title,setTitle] = useState("");
    const [price,setPrice] = useState("");
    const [message,setMessage] = useState("");

    const handleSubmit = async (e)=>{
        e.preventDefault();
        try{
            await api("/api/listings",{
                method:"POST",
                body:JSON.stringify({title,price}),
            });

            setMessage("Listing added successfully!");
            setTitle("");
            setPrice("");
        }catch (err){
            setMessage(err.message);
        }
    };

    return(
        <ProtectedRoute>
            <div>
                <Navbar />
                <main className="p-10">
                    <h1 className="text-2xl font-bold mb-4">Add New Listing</h1>
                    {message && <p className="mb-4">{message}</p>}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
                        <input 
                            type="text"
                            placeholder="Title"
                            className="border p-2"
                            value={title}
                            onChange={(e)=>setTitle(e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            className="border p-2"
                            value={price}
                            onChange={(e)=> setPrice(e.target.value)}
                            required
                        />
                        <button type="submit" className="bg-lama p-2 text-white">
                            Add Listing
                        </button>
                    </form>
                </main>
            </div>
        </ProtectedRoute>
    )
}