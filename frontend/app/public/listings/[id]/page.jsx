"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "../../../utils/api.js";
import { useParams } from "next/navigation";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function PublicListingDetail() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showGuests, setShowGuests] = useState(false);

  const calendarRef = useRef(null);
  const timeSlotsRef = useRef(null);
  const guestsRef = useRef(null);

  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    guests: 10,
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isBooking, setIsBooking] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (timeSlotsRef.current && !timeSlotsRef.current.contains(e.target)) setShowTimeSlots(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    const data = await api(`/api/publicListings/${id}`);
    setListing(data);
  };

  const daysInMonth = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    return {
      days: new Date(y, m + 1, 0).getDate(),
      start: new Date(y, m, 1).getDay(),
    };
  };

  const selectDate = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDate < today) return;
    const d = formatDateLocal(selectedDate);
    setBookingData({ ...bookingData, date: d });
    setShowCalendar(false);
    setShowTimeSlots(true);
  };

  const isPastDate = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d < today;
  };

  const formatSelectedDate = () => {
    if (!bookingData.date) return "Pick a date";
    return new Date(bookingData.date).toLocaleDateString("en-US", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const start = parseInt(bookingData.startTime.split(':')[0]);
    const end = parseInt(bookingData.endTime.split(':')[0]);
    return end - start;
  };

  const calculateTotal = () => {
    const hours = calculateDuration();
    return hours * (listing?.hourlyRate || listing?.price || 0);
  };

  const handleBooking = async () => {
    if (!bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      alert("Please select date and time");
      return;
    }
    setIsBooking(true);
    // Booking logic here
    setTimeout(() => {
      alert("🎉 Booking confirmed!");
      setIsBooking(false);
    }, 1500);
  };

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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* HERO IMAGE - Full Bleed */}
      <div className="relative h-[60vh] md:h-[70vh] bg-stone-900 overflow-hidden">
        {listing.images?.[currentImageIndex]?.url ? (
          <>
            <img
              src={listing.images[currentImageIndex].url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600" />
        )}

        {/* Image Navigation */}
        {listing.images?.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {listing.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`transition-all ${
                    idx === currentImageIndex 
                      ? "w-8 h-2 bg-white" 
                      : "w-2 h-2 bg-white/50 hover:bg-white/70"
                  } rounded-full`}
                />
              ))}
            </div>
          </>
        )}

        {/* Title Overlay - Magazine Style */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => window.history.back()}
              className="mb-6 inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight max-w-4xl drop-shadow-2xl">
              {listing.title}
            </h1>
            
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-medium">{listing.location}</span>
              </div>
              {listing.capacity && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">Up to {listing.capacity} guests</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - Split Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT - Details */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Host Card */}
            <div className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                {listing.host?.profilePhoto ? (
                  <img src={listing.host.profilePhoto} alt={listing.host.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white font-black text-2xl">
                    {listing.host?.name?.charAt(0) || "H"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-stone-500 font-medium">Hosted by</p>
                <p className="text-xl font-black text-stone-900">{listing.host?.name || "Host"}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-3xl font-black text-stone-900 mb-4">The Experience</h2>
              <p className="text-lg text-stone-700 leading-relaxed whitespace-pre-line">
                {listing.description || "A beautiful space perfect for your next celebration."}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="text-3xl font-black text-stone-900 mb-6">What's Included</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">✓</span>
                      </div>
                      <span className="font-bold text-stone-800 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hours */}
            {listing.operatingHours && (
              <div>
                <h2 className="text-3xl font-black text-stone-900 mb-4">Hours</h2>
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <p className="text-stone-700">
                    <span className="font-bold">Open:</span> {listing.operatingHours.monday?.start || "9:00 AM"} - {listing.operatingHours.monday?.end || "9:00 PM"}
                  </p>
                  <p className="text-sm text-stone-500 mt-2">Available 7 days a week</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT - Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-stone-200">
                
                {/* Price Header */}
                <div className="bg-gradient-to-r from-lime-400 to-emerald-500 p-6 text-center">
                  <div className="text-5xl font-black text-white mb-1">
                    ${listing.hourlyRate || listing.price}
                  </div>
                  <div className="text-white/90 font-medium">per hour</div>
                </div>

                {/* Booking Form */}
                <div className="p-6 space-y-4">
                  
                  {/* Date Picker */}
                  <div ref={calendarRef} className="relative">
                    <label className="block text-sm font-black text-stone-900 mb-2">📅 Pick Your Date</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCalendar(!showCalendar);
                        setShowTimeSlots(false);
                        setShowGuests(false);
                      }}
                      className="w-full p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl text-left font-bold text-stone-800 transition-all border-2 border-transparent hover:border-lime-400"
                    >
                      {formatSelectedDate()}
                    </button>

                    {showCalendar && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-stone-200 p-4 z-50">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            className="p-2 hover:bg-stone-100 rounded-lg"
                          >
                            ←
                          </button>
                          <div className="font-black text-stone-900">
                            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </div>
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            className="p-2 hover:bg-stone-100 rounded-lg"
                          >
                            →
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <div key={i} className="text-center text-xs font-bold text-stone-500 py-2">{d}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {[...Array(daysInMonth().start)].map((_, i) => (
                            <div key={`e-${i}`} />
                          ))}
                          {[...Array(daysInMonth().days)].map((_, i) => {
                            const day = i + 1;
                            const past = isPastDate(day);
                            const selected = bookingData.date === formatDateLocal(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

                            return (
                              <button
                                key={day}
                                onClick={() => selectDate(day)}
                                disabled={past}
                                className={`aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-all
                                  ${past ? "text-stone-300 cursor-not-allowed" : "hover:bg-lime-100 cursor-pointer"}
                                  ${selected ? "bg-lime-400 text-white" : "text-stone-800"}
                                `}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Slots */}
                  <div ref={timeSlotsRef} className="relative">
                    <label className="block text-sm font-black text-stone-900 mb-2">⏰ Choose Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTimeSlots(!showTimeSlots);
                          setShowCalendar(false);
                          setShowGuests(false);
                        }}
                        className={`p-3 rounded-xl font-bold text-sm transition-all ${
                          bookingData.startTime 
                            ? "bg-lime-400 text-white" 
                            : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                        }`}
                      >
                        {bookingData.startTime || "Start"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTimeSlots(!showTimeSlots);
                          setShowCalendar(false);
                          setShowGuests(false);
                        }}
                        className={`p-3 rounded-xl font-bold text-sm transition-all ${
                          bookingData.endTime 
                            ? "bg-lime-400 text-white" 
                            : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                        }`}
                      >
                        {bookingData.endTime || "End"}
                      </button>
                    </div>

                    {showTimeSlots && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-stone-200 p-4 z-50 max-h-64 overflow-y-auto">
                        <p className="text-xs font-bold text-stone-500 mb-3">
                          {!bookingData.startTime ? "Select start time" : "Select end time"}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                if (!bookingData.startTime) {
                                  setBookingData({ ...bookingData, startTime: time });
                                } else {
                                  setBookingData({ ...bookingData, endTime: time });
                                  setShowTimeSlots(false);
                                }
                              }}
                              className="p-2 bg-stone-50 hover:bg-lime-100 rounded-lg text-sm font-bold text-stone-800 transition-all"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Guests */}
                  <div ref={guestsRef} className="relative">
                    <label className="block text-sm font-black text-stone-900 mb-2">👥 Number of Guests</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuests(!showGuests);
                        setShowCalendar(false);
                        setShowTimeSlots(false);
                      }}
                      className="w-full p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl text-left font-bold text-stone-800 transition-all border-2 border-transparent hover:border-lime-400"
                    >
                      {bookingData.guests} guests
                    </button>

                    {showGuests && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-stone-200 p-6 z-50">
                        <div className="flex items-center justify-center gap-6">
                          <button
                            onClick={() => setBookingData({ ...bookingData, guests: Math.max(1, bookingData.guests - 1) })}
                            className="w-12 h-12 rounded-full bg-stone-100 hover:bg-lime-400 hover:text-white font-black text-2xl transition-all"
                          >
                            −
                          </button>
                          <span className="text-4xl font-black text-stone-900 w-20 text-center">
                            {bookingData.guests}
                          </span>
                          <button
                            onClick={() => setBookingData({ ...bookingData, guests: Math.min(listing.capacity || 100, bookingData.guests + 1) })}
                            className="w-12 h-12 rounded-full bg-stone-100 hover:bg-lime-400 hover:text-white font-black text-2xl transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  {calculateDuration() > 0 && (
                    <div className="pt-4 border-t-2 border-stone-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stone-600">
                          ${listing.hourlyRate || listing.price} × {calculateDuration()} hours
                        </span>
                        <span className="font-bold text-stone-900">${calculateTotal()}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black">
                        <span>Total</span>
                        <span className="text-lime-600">${calculateTotal()}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={!bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 ${
                      !bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-lime-400 to-emerald-500 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isBooking ? "Booking..." : "Reserve Your Spot"}
                  </button>

                  <p className="text-xs text-center text-stone-500">
                    You won't be charged yet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}