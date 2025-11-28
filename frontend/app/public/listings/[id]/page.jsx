"use client";

import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useParams } from "next/navigation";

export default function PublicListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    fetchListing();
    fetchAvailability();
  }, [id]);

  const fetchListing = async () => {
    const data = await api(`/api/publicListings/${id}`);
    setListing(data);
  };

  const fetchAvailability = async () => {
    const data = await api(`/api/availability/${id}`);
    setAvailability(data);
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-6">

      {/* LISTING TITLE */}
      <h1 className="text-3xl font-bold">{listing.title}</h1>
      <p className="text-gray-600">{listing.location}</p>

      {/* IMAGES */}
      {listing.images && listing.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {listing.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Listing"
              className="w-full h-48 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* PRICE */}
      <p className="text-xl font-semibold text-green-700">
        ${listing.price} / night
      </p>

      {/* DESCRIPTION */}
      <div>
        <h2 className="text-xl font-bold mb-2">Description</h2>
        <p className="text-gray-700">{listing.description}</p>
      </div>

      {/* AMENITIES */}
      {listing.amenities && listing.amenities.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Amenities</h2>
          <ul className="list-disc ml-5 text-gray-700">
            {listing.amenities.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AVAILABLE DATES */}
      <div>
        <h2 className="text-xl font-bold mt-8 mb-3">Available Dates</h2>

        {availability.length === 0 ? (
          <p className="text-gray-500">This listing has no available dates.</p>
        ) : (
          <ul className="space-y-2">
            {availability.map((a) => (
              <li
                key={a.id}
                className="border p-2 rounded bg-green-100 text-green-900"
              >
                {new Date(a.date).toISOString().split("T")[0]}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
