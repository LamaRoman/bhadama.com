"use client";

import { useEffect, useState } from "react";
import { api } from "../utils/api.js"
import SearchBar from "../../components/SearchBar.jsx"

export default function PublicListings() {
  const [listings, setListings] = useState([]);

  const fetchListings = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const data = await api(`/api/publicListings?${params}`);
    setListings(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="p-5 max-w-6xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">Find Your Stay</h1>

      {/* Search Bar */}
      <SearchBar onSearch={fetchListings} />

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            {listing.images?.[0] && (
              <img src={listing.images[0].url} className="w-full h-36 object-cover" />
            )}
            <div className="p-3">
              <h2 className="font-bold">{listing.title}</h2>
              <p className="text-sm text-gray-600">{listing.location}</p>
              <p className="text-sm font-semibold text-green-700">${listing.price}/night</p>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No listings found.</p>
      )}
    </div>
  );
}
