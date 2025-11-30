"use client";
import { useState } from "react";
import { api } from "../app/utils/api.js";
import DatePicker from "react-multi-date-picker";
import "react-multi-date-picker/styles/colors/green.css";

export default function UserBookings({ bookings, setBookings }) {
  const [editingId, setEditingId] = useState(null);
  const [selectedRange, setSelectedRange] = useState([null, null]);

  const handleEdit = (booking) => {
    setEditingId(booking.id);
    setSelectedRange([new Date(booking.startDate), new Date(booking.endDate)]);
  };

  const saveEdit = async (bookingId) => {
    if (!selectedRange[0] || !selectedRange[1]) return alert("Select a date range");
    const datesArray = [];
    let current = new Date(selectedRange[0]);
    const last = new Date(selectedRange[1]);

    while (current <= last) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      datesArray.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }

    try {
      await api(`/api/usersBookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: datesArray }),
      });
      alert("Booking updated!");
      setEditingId(null);
      // Refresh bookings
      const updated = await api("/api/usersBookings");
      setBookings(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error(err);
      alert("Failed to update booking");
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await api(`/api/bookings/${bookingId}`, { method: "DELETE" });
      alert("Booking deleted");
      setBookings(bookings.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete booking");
    }
  };

  return (
    <div className="space-y-4">
      {bookings.length === 0 && <p>No bookings found.</p>}
      {bookings.map((booking) => (
        <div key={booking.id} className="border rounded p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">{booking.listingTitle}</p>
            <p>
              {new Date(booking.startDate).toLocaleDateString()} -{" "}
              {new Date(booking.endDate).toLocaleDateString()}
            </p>
          </div>

          {editingId === booking.id ? (
            <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center gap-2">
              <DatePicker
                value={selectedRange}
                onChange={setSelectedRange}
                range
                numberOfMonths={2}
                minDate={new Date()}
                format="YYYY-MM-DD"
                className="green"
                style={{ width: "100%" }}
              />
              <button
                onClick={() => saveEdit(booking.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-2 md:mt-0 flex gap-2">
              <button
                onClick={() => handleEdit(booking)}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBooking(booking.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
