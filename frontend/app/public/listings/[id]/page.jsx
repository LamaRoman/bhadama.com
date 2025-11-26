"use client";

import { useEffect, useState } from "react";
import { api } from "../../../utils/api.js";
import { useParams } from "next/navigation";

export default function PublicListingDetails() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api(`/api/publicListings/${id}`);

        setListing(data.listing);
        setAvailability(data.availability);
      } catch (error) {
        console.error("Failed to load listing", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) return <p>Loading listing...</p>;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="p-4 border rounded shadow max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
      <p className="mb-2">{listing.description}</p>
      <p className="font-semibold mb-2">Price: ${listing.price}</p>

      {listing.host && (
        <p className="text-sm text-gray-500 mb-4">
          Host: {listing.host.name}
        </p>
      )}

      <h2 className="text-xl font-bold mt-4">Availability</h2>
      <ul className="mt-2 space-y-1">
        {availability.map((a, index) => (
          <li
            key={index}
            className={`p-2 rounded ${
              a.is_available ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {a.date} — {a.is_available ? "Available" : "Booked"}
          </li>
        ))}
      </ul>
    </div>
  );
}
