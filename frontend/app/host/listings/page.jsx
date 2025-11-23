"use client";
import { useEffect, useState } from "react";
import { api } from "../../utils/api";

export default function HostListings() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await api("/api/listings", { method: "GET" });
        setListings(data);
      } catch (err) {
        console.error("Error fetching listings:", err);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">My Listings</h1>

      {listings.map((l) => (
        <div key={l.id} className="border p-3 rounded mb-2">
          <h2 className="font-semibold">{l.title}</h2>
          <p>{l.location}</p>
          <p>${l.price}</p>
        </div>
      ))}
    </div>
  );
}
