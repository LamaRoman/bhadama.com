// LIST ALL LISTINGS
// HOST LISTING HOMEPAGE

"use client";
import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useRouter } from "next/navigation";

export default function HostListings() {
  const [listings, setListings] = useState([]);
  const router = useRouter();

  const fetchListings = async () => {
    try {
      const data = await api("/api/hostListings");
      setListings(data);
    } catch (err) {
      console.error(err);
      setListings([]);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    await api(`/api/hostListings/${id}`, { method: "DELETE" });
    fetchListings(); // refresh list after deletion
  };

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">My Listings</h1>

      {listings.map((l) => (
        <div key={l.id} className="border p-3 rounded mb-2">
          <div>
            <h2 className="font-semibold">{l.title}</h2>
            <p>{l.location}</p>
            <p>${l.price}</p>
          </div>

          <div className="flex gap-2">
            <button
              className="bg-yellow-500 text-white px-3 py-1 rounded"
              onClick={() => router.push(`/host/listings/${l.id}`)}
            >
              Edit
            </button>

            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => router.push(`/host/listings/${l.id}/availability`)}
            >
              Manage Availability
            </button>

            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => handleDelete(l.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
