"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../utils/api.js";

export default function PublicListingsPage() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await api("/api/publicListings");
        setListings(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchListings();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Available Listings</h1>
      <div className="grid grid-cols-3 gap-6">
        {listings.map((l) => (
          <Link key={l.id} href={`/public/listings/${l.id}`}>
            <div className="border p-4 rounded hover:shadow-lg cursor-pointer">
              <h2 className="font-bold">{l.title}</h2>
              <p>{l.description}</p>
              <p className="font-semibold">Price: ${l.price}</p>
              <p className="text-sm text-gray-500">Host: {l.host.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
