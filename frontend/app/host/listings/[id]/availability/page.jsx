"use client";

import { useEffect, useState } from "react";
import { api } from "../../../../../utils/api.js";
import { useParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ListingAvailability() {
  const { id } = useParams();
  const [blockedDates, setBlockedDates] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetchAvailability();
  }, [id]);

  const fetchAvailability = async () => {
    try {
      const data = await api(`/api/hostListings/availability/${id}`);
      // Ensure uniqueness
      setBlockedDates([...new Set(data.blockedDates || [])]);
      setBookedDates([...new Set(data.bookedDates || [])]);
      setSelectedDates([]);
    } catch (err) {
      console.error("Fetch availability error:", err);
    }
  };

  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Block or unblock selected dates
  const toggleDates = async (action) => {
    if (selectedDates.length === 0) return alert("Select at least one date");

    const datesStr = selectedDates.map(formatDateLocal);
    const endpoint =
      action === "block"
        ? "/api/hostListings/block-dates"
        : "/api/hostListings/unblock-dates";

    try {
      await api(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: Number(id), dates: datesStr }),
      });
      setSelectedDates([]);
      fetchAvailability();
    } catch (err) {
      console.error(`${action} error:`, err);
      alert(err.message || `Failed to ${action} dates`);
    }
  };

  const today = new Date();

  // Convert blocked/booked dates to unique Date objects
  const blockedDatesObjects = Array.from(
    new Set(blockedDates.map((d) => parseLocalDate(d).getTime()))
  ).map((t) => new Date(t));

  const bookedDatesObjects = Array.from(
    new Set(bookedDates.map((d) => parseLocalDate(d).getTime()))
  ).map((t) => new Date(t));

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Manage Availability</h1>

      <DatePicker
        inline
        selected={null}
        onChange={(date) => {
          setSelectedDates((prev) => {
            const exists = prev.find((d) => d.getTime() === date.getTime());
            if (exists) return prev.filter((d) => d.getTime() !== date.getTime());
            return [...prev, date];
          });
        }}
        minDate={today}
        dayClassName={(date) => {
          if (blockedDatesObjects.some((d) => d.getTime() === date.getTime()))
            return "bg-red-300 text-white line-through rounded";
          if (bookedDatesObjects.some((d) => d.getTime() === date.getTime()))
            return "bg-green-400 text-white rounded";
          if (selectedDates.find((d) => d.getTime() === date.getTime()))
            return "bg-blue-400 text-white rounded";
          return "";
        }}
      />

      <div className="mt-3 flex gap-3">
        <button
          onClick={() => toggleDates("block")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Block Selected
        </button>

        <button
          onClick={() => toggleDates("unblock")}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Unblock Selected
        </button>
      </div>

      <h2 className="text-lg font-semibold mt-6">Blocked Dates</h2>
      <ul className="mt-3 space-y-2">
        {blockedDates.map((dateStr, idx) => (
          <li key={dateStr + idx} className="flex items-center justify-between border p-3 rounded">
            <span className="text-red-600 line-through font-semibold">
              {parseLocalDate(dateStr).toDateString()}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mt-6">Booked Dates</h2>
      <ul className="mt-3 space-y-2">
        {bookedDates.map((dateStr, idx) => (
          <li key={dateStr + idx} className="flex items-center justify-between border p-3 rounded">
            <span className="text-green-600 font-semibold">
              {parseLocalDate(dateStr).toDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
