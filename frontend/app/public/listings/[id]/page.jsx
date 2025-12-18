"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "../../../utils/api.js";
import { useParams } from "next/navigation";

// Helper function to format date as YYYY-MM-DD in LOCAL timezone (not UTC)
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to parse a date string as local date (avoiding timezone shifts)
const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Helper to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export default function PublicListingBooking() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const datePickerRef = useRef(null);
  const guestPickerRef = useRef(null);

  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 2,
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isBooking, setIsBooking] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close pickers when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
      if (guestPickerRef.current && !guestPickerRef.current.contains(e.target)) {
        setShowGuestPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // Parse blocked days
  const blockedDays = availability
    .filter((a) => !a.isAvailable)
    .map((a) => {
      const dateStr = a.date.split("T")[0];
      return parseLocalDate(dateStr);
    });

  const isBlocked = (date) => {
    const dateStr = formatDateLocal(date);
    return blockedDays.some((d) => formatDateLocal(d) === dateStr);
  };

  /* ---------------- CALENDAR ---------------- */
  const daysInMonth = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    return {
      days: new Date(y, m + 1, 0).getDate(),
      start: new Date(y, m, 1).getDay(),
    };
  };

  const selectDate = (day) => {
    // Create date in local timezone (no UTC conversion)
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    
    if (selectedDate < today) return;

    // Format as YYYY-MM-DD in local timezone
    const d = formatDateLocal(selectedDate);

    if (!bookingData.checkIn || bookingData.checkOut) {
      setBookingData({ ...bookingData, checkIn: d, checkOut: "" });
    } else if (d > bookingData.checkIn) {
      setBookingData({ ...bookingData, checkOut: d });
    } else {
      setBookingData({ ...bookingData, checkIn: d, checkOut: "" });
    }
  };

  const isDateInRange = (day) => {
    if (!bookingData.checkIn || !bookingData.checkOut) return false;
    const d = formatDateLocal(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return d > bookingData.checkIn && d < bookingData.checkOut;
  };

  const isDateSelected = (day) => {
    const d = formatDateLocal(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return d === bookingData.checkIn || d === bookingData.checkOut;
  };

  const isPastDate = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    return d < todayCheck;
  };

  const formatDateRange = () => {
    if (!bookingData.checkIn) return "Add dates";
    const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return bookingData.checkOut
      ? `${formatDate(bookingData.checkIn)} - ${formatDate(bookingData.checkOut)}`
      : `${formatDate(bookingData.checkIn)} - ?`;
  };

  const handleBooking = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      return alert("Please select check-in and check-out dates");
    }

    setIsBooking(true);

    // FIXED: Build dates array for nights stayed (checkout date is departure, not a night stayed)
    let datesArray = [];
    let current = parseLocalDate(bookingData.checkIn);
    const end = parseLocalDate(bookingData.checkOut);

    while (current < end) {  // Changed from <= to < (checkout is departure day)
      if (!isBlocked(current)) {
        datesArray.push(formatDateLocal(current));
      }
      current.setDate(current.getDate() + 1);
    }

    console.log("Booking dates:", datesArray); // DEBUG

    if (datesArray.length === 0) {
      alert("No available dates selected");
      setIsBooking(false);
      return;
    }

    try {
      const response = await api("/api/bookings", {
        method: "POST",
        body: {
          listingId: Number(id),
          dates: datesArray,
        },
      });

      console.log("Booking response:", response); // DEBUG

      alert("Booked successfully!");
      setBookingData({ checkIn: "", checkOut: "", guests: 2 });
      fetchAvailability();
    } catch (e) {
      console.error("Booking error:", e);
      alert("Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  // Calculate nights - FIXED: should not include checkout day
  const nightsCount =
    bookingData.checkIn && bookingData.checkOut
      ? Math.round(
          (parseLocalDate(bookingData.checkOut) - parseLocalDate(bookingData.checkIn)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalPrice = listing ? listing.price * nightsCount : 0;

  // Image carousel functions
  const nextImage = () => {
    if (listing?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-5 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Listing Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Carousel */}
            <div className="relative h-96 md:h-[500px] bg-gray-100 rounded-2xl overflow-hidden group">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <img
                    src={listing.images[currentImageIndex]?.url}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {listing.images.length > 1 && (
                    <>
                      {/* Navigation Arrows */}
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {listing.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-6" : "bg-white/60 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Image Counter */}
                      <div className="absolute top-4 right-4 bg-black/70 text-white text-sm font-medium px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {listing.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title and Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {listing.title}
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </p>
            </div>

          {/* Host Info */}
<div className="border-y border-gray-200 py-6">
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
      {listing.host?.profilePhoto ? (
        <img
          src={listing.host.profilePhoto}
          alt={listing.host.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-bold text-xl">
          {listing.host?.name?.charAt(0).toUpperCase() || "H"}
        </span>
      )}
    </div>
    <div>
      <p className="font-semibold text-gray-900 text-lg">
        Hosted by {listing.host?.name || "Host"}
      </p>
      <p className="text-sm text-gray-500">Superhost</p>
    </div>
  </div>
</div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this place</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-xl">
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">${listing.price}</span>
                  <span className="text-gray-600">per night</span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleBooking(); }} className="space-y-3">
                
                {/* Dates */}
                <div ref={datePickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                      setShowGuestPicker(false);
                    }}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all font-medium bg-white text-left flex items-center justify-between"
                  >
                    <span className={bookingData.checkIn ? "text-gray-800" : "text-gray-400"}>
                      {formatDateRange()}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {showDatePicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-5 z-[2000] animate-fade-in">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentMonth(
                              new Date(
                                currentMonth.getFullYear(),
                                currentMonth.getMonth() - 1
                              )
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="font-bold text-gray-900">
                          {currentMonth.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentMonth(
                              new Date(
                                currentMonth.getFullYear(),
                                currentMonth.getMonth() + 1
                              )
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {[...Array(daysInMonth().start)].map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {[...Array(daysInMonth().days)].map((_, i) => {
                          const day = i + 1;
                          const selected = isDateSelected(day);
                          const inRange = isDateInRange(day);
                          const past = isPastDate(day);

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => selectDate(day)}
                              disabled={past}
                              className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                                ${past ? "text-gray-300 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"}
                                ${selected ? "bg-blue-600 text-white font-bold hover:bg-blue-700" : ""}
                                ${inRange ? "bg-blue-100 text-blue-900" : ""}
                                ${!selected && !inRange && !past ? "text-gray-900" : ""}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() =>
                            setBookingData({ ...bookingData, checkIn: "", checkOut: "" })
                          }
                          className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(false)}
                          disabled={!bookingData.checkIn || !bookingData.checkOut}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Guests */}
                <div ref={guestPickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuestPicker(!showGuestPicker);
                      setShowDatePicker(false);
                    }}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all font-medium bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-gray-800">
                      {bookingData.guests} {bookingData.guests === 1 ? "Guest" : "Guests"}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {showGuestPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white p-5 rounded-2xl shadow-2xl border-2 border-gray-200 z-[2000] animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-gray-700">Guests</span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setBookingData({
                                ...bookingData,
                                guests: Math.max(1, bookingData.guests - 1),
                              })
                            }
                            disabled={bookingData.guests <= 1}
                            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-xl font-bold text-gray-900 w-10 text-center">
                            {bookingData.guests}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setBookingData({
                                ...bookingData,
                                guests: Math.min(16, bookingData.guests + 1),
                              })
                            }
                            disabled={bookingData.guests >= 16}
                            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGuestPicker(false)}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Book Button */}
                <button
                  type="submit"
                  disabled={!bookingData.checkIn || !bookingData.checkOut || isBooking}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-base transition-all duration-200 ${
                    !bookingData.checkIn || !bookingData.checkOut || isBooking
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                  }`}
                >
                  {isBooking ? "Booking..." : "Reserve"}
                </button>
              </form>

              {/* Price Breakdown */}
              {bookingData.checkIn && bookingData.checkOut && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      ${listing.price} × {nightsCount} night{nightsCount !== 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold text-gray-900">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}