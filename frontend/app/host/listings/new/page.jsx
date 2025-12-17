"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api.js";

export default function NewListing() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    status:"ACTIVE"
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // 1️⃣ Create listing
    const createRes = await api("/api/host/listings", {
      method: "POST",
      body: form,
    });

    console.log("Create response:", createRes); // Debug

    // Check for error or missing data
    if (createRes.error) {
      setError(createRes.error);
      setLoading(false);
      return;
    }

    // Handle different response structures
    const listingId = createRes.listing?.id || createRes.id;

    if (!listingId) {
      setError("Failed to create listing - no ID returned");
      setLoading(false);
      return;
    }

    // 2️⃣ Upload images (if any)
    if (files.length > 0) {
      const formData = new FormData();
      for (const file of files) {
        formData.append("images", file);
      }

      // ✅ Fixed URL: /api/host/listings (not /api/hostListings)
      const uploadRes = await api(`/api/host/listings/${listingId}/images`, {
        method: "POST",
        body: formData,
      });

      if (uploadRes.error) {
        setError(uploadRes.error);
        setLoading(false);
        return;
      }

      console.log("Images uploaded:", uploadRes);
    }

    // 3️⃣ Redirect to dashboard
    router.push("/host/dashboard");
  } catch (err) {
    console.error(err);
    setError("Server error, please try again");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Create Listing</h1>
      {error && <p className="text-red-500 my-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input
          placeholder="Title"
          className="w-full p-3 border"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          className="w-full p-3 border"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          className="w-full p-3 border"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Location"
          className="w-full p-3 border"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-3 rounded w-full disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
    </div>
  );
}