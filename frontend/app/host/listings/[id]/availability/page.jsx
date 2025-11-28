"use client";

import { useEffect, useState } from "react";
import { api } from "../../../../utils/api.js";
import { useParams } from "next/navigation";

export default function ListingAvailability() {
  const { id } = useParams();
  const [availability, setAvailability] = useState([]);
  const [newDates, setNewDates] = useState(""); // comma separated input

  const fetchAvailability = async () => {
    const data = await api(`/api/availability/${id}`);
    setAvailability(data);
  };

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const handleAddDates = async () => {
    const datesArray = newDates
      .split(",")
      .map((d) => d.trim())
      .filter((d) => !isNaN(new Date(d).getTime()));
    if (datesArray.length === 0) {
      alert("Invalid date format.");
      return;
    }
    await api(`/api/availability/${id}`, {
      method: "POST",
      body: JSON.stringify({ dates: datesArray }),
    });
    setNewDates("");
    fetchAvailability();
  };

  const toggleAvailability = async (availabilityId) => {
    await api(`/api/availability/${availabilityId}/toggle`, {
      method: "put",
    });
    fetchAvailability();
  };

  return (
    <div className="p-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Manage Availability</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter dates, comma separated (YYYY-MM-DD)"
          value={newDates}
          onChange={(e) => setNewDates(e.target.value)}
          className="border p-2 w-full"
        />
        <button
          onClick={handleAddDates}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
        >
          Add Dates
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">All Dates</h2>
      <ul>
        {availability.map((a) => (
          <li
            key={a.id}
            className="flex justify-between border p-2 mb-1 rounded"
          >
            <span>{new Date(a.date).toISOString().split("T")[0]}</span>
            <button
              onClick={() => toggleAvailability(a.id)}
              className={`px-3 py-1 rounded ${
                a.isAvailable ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {a.isAvailable ? "Available" : "Unavailable"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
