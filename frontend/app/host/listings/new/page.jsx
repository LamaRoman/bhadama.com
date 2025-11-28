"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";
export default function NewListing() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/hostListings", {
        method: "POST",
        body: JSON.stringify(form),
      });
    } catch (err) {
      console.error("Error creating listing:", err);
    }
  };

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Create Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">

        <input
          name="title"
          placeholder="Title"
          className="w-full p-3 border"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-3 border"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          name="price"
          placeholder="Price"
          type="number"
          className="w-full p-3 border"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input
          name="location"
          placeholder="Location"
          className="w-full p-3 border"
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <button className="bg-blue-600 text-white p-3 rounded w-full">
          Create Listing
        </button>
      </form>
    </div>
  );
}