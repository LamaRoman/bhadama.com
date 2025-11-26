"use client";
import { useEffect,useState } from "react";
import { api } from "../../../utils/api";
import { useParams, useRouter } from "next/navigation";

export default function EditListing(){
    const router = useRouter();
    const {id} = useParams();

    const [form,setForm] = useState({
        title:"",
        description:"",
        price:"",
        location:"",
    })

    useEffect(()=>{
        const fetchListing = async()=>{
            const data = await api(`/api/listings/${id}`);
            setForm({
                title:data.title,
                description:data.description,
                price:data.price,
                location:data.location,
            });
        };
        fetchListing();
    },[id]);

    const handleSubmit = async (e) =>{
        e.preventDefault();
        await api(`/api/listings/${id}`,
            {method:"PUT",body:JSON.stringify(form)})
            router.push("/host/listings")
        };

        return(
            <div className="p-5 max-w-lg mx-auto">
                <h1 className="text-xl font-bold">Edit Listing</h1>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <input
                    name="title"
                    placeholder="Title"
                    value={form.title}
                    className="w-full p-3 border"
                    onChange={(e)=>setForm({...form,title:e.target.value})}
                    />
                    
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        className="w-full p-3 border"
                        onChange={(e)=>setForm({...form,description:e.target.value})}
                    />

                    <input
                        name="price"
                        type="number"
                        placeholder="Price"
                        value={form.price}
                        className="w-full p-3 border"
                        onChange={(e)=>setForm({...form, price:e.target.value})}
                    />

                    <input
                        name="location"
                        placeholder="Location"
                        value={form.location}
                        className="w-full p-3 border"
                        onChange={(e)=>setForm({...form,location: e.target.value})}
                    />

                    <button className="bg-blue-600 text-white p-3 rounded w-full">
                        Update Listing
                    </button>
                </form>
            </div>
        )
}