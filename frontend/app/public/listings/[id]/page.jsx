"use client";

import { useEffect, useState } from "react";
import { api } from "../../../utils/api.js";
import { useParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../../app/styles/datepicker.css";

export default function PublicListingBooking() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedRange, setSelectedRange] = useState([null, null]);

  const today = new Date();

  useEffect(() => {
    if (!id) return;
    fetchListing();
    fetchAvailability();
  }, [id]);

  const fetchListing = async () => {
    const data = await api(`/api/publicListings/${id}`);
    setListing(data);
  };

  const fetchAvailability = async () => {
    const data = await api(`/api/availability/${id}`);
    setAvailability(Array.isArray(data) ? data : []);
  };

  const blockedDays = availability
    .filter((a) => !a.isAvailable)
    .map((a) => new Date(a.date));

  const isBlocked = (date) => {
    return blockedDays.some(
      (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
    );
  };

  const handleBooking = async () => {
    const [start, end] = selectedRange;
    if (!start || !end) return alert("Select a date range");

    let datesArray = [];
    let current = new Date(start);

    while (current <= end) {
      if (!isBlocked(current)) {
        datesArray.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    if (datesArray.length === 0) {
      alert("No available dates selected");
      return;
    }

    try {
      await api("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: Number(id),
          dates: datesArray,
        }),
      });

      alert("Booked!");
      setSelectedRange([null, null]);
      fetchAvailability();
    } catch (e) {
      console.error(e);
      alert("Booking failed");
    }
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{listing.title}</h1>

      <div className="mt-4 border rounded-xl p-3 bg-white shadow-sm">
  <DatePicker
    selectsRange
    startDate={selectedRange[0]}
    endDate={selectedRange[1]}
    onChange={(update) => setSelectedRange(update)}
    minDate={today}
    excludeDates={blockedDays}
    monthsShown={2}
    inline
    calendarClassName="airbnb-calendar"
  />
</div>


      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleBooking}
        disabled={!selectedRange[0] || !selectedRange[1]}
      >
        Book Now
      </button>
    </div>
  );
}
