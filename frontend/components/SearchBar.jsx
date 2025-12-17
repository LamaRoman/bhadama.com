"use client";

import { useEffect, useRef, useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SearchBar({ onSearch }) {
  const [location, setLocation] = useState("");
  const [pax, setPax] = useState(1);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);

  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  const inputRef = useRef(null);

  // Google Location Autocomplete
  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["(cities)"],
        componentRestrictions: { country: ["np"] },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setLocation(place.formatted_address || place.name);
    });
  }, []);

  const handleSearch = () => {
    onSearch({
      location,
      pax,
      checkIn,
      checkOut,
      category,
      sortBy,
    });
  };

  // Custom Date Range Button (like Airbnb)
  const DateRangeButton = forwardRef(({ value, onClick }, ref) => {
    return (
      <button
        className="border p-3 rounded-lg w-48 text-left"
        onClick={onClick}
        ref={ref}
      >
        {value || "Check-in → Check-out"}
      </button>
    );
  });

  return (
    <div className="bg-white shadow p-4 rounded-xl mb-6">

      {/* Row 1: Main Search Bar */}
      <div className="flex flex-wrap gap-4 items-center">

        {/* Location */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Where are you going?"
          className="border p-3 rounded-lg flex-1 min-w-[240px]"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        {/* Check-in / Check-out */}
        <DatePicker
          selectsRange
          startDate={checkIn}
          endDate={checkOut}
          onChange={(dates) => {
            const [start, end] = dates;
            setCheckIn(start);
            setCheckOut(end);
          }}
          monthsShown={2}
          placeholderText="Check-in → Check-out"
          customInput={<DateRangeButton />}
        />

        {/* Guests */}
        <input
          type="number"
          placeholder="Guests"
          className="border p-3 rounded-lg w-20"
          value={pax}
          min={1}
          onChange={(e) => setPax(Number(e.target.value))}
        />

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Row 2: Categories + Sort */}
      <div className="flex justify-start items-center gap-4 mt-3">

        {/* Categories */}
        <select
          className="border rounded-md px-3 h-9 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="room">Room</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="hostel">Hostel</option>
        </select>

        {/* Sort */}
        <select
          className="border rounded-md px-3 h-9 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="">Sort</option>
          <option value="low-high">Price: Low → High</option>
          <option value="high-low">Price: High → Low</option>
          <option value="newest">Newest</option>
          <option value="recommended">Recommended</option>
        </select>
      </div>
    </div>
  );
}
