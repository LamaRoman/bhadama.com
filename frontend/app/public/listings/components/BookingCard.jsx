"use client";

import { useRef, useMemo } from "react";
import { toast } from "react-hot-toast";
import Calendar from "./Calendar";
import { formatDateDisplay, generateTimeSlots, getOperatingHoursForDate } from "./utils";

export default function BookingCard({
  listing,
  bookingData,
  setBookingData,
  showCalendar,
  setShowCalendar,
  showTimeSlots,
  setShowTimeSlots,
  showGuests,
  setShowGuests,
  currentMonth,
  setCurrentMonth,
  availabilityData,
  isBooking,
  handleBooking,
  calendarRef,
  timeSlotsRef,
  guestsRef,
  isOwnListing = false,
}) {
  const formatSelectedDate = () => {
    if (!bookingData.date) return "Select date";
    return formatDateDisplay(new Date(bookingData.date));
  };

  const startSlots = useMemo(() => {
    if (!bookingData.date || !listing?.operatingHours) return [];
    
    const dayAvailability = availabilityData[bookingData.date];
    const operatingHours = getOperatingHoursForDate(new Date(bookingData.date), listing.operatingHours);
    
    if (!operatingHours || operatingHours.closed) return [];
    
    const allSlots = generateTimeSlots(
      operatingHours.start || "09:00",
      operatingHours.end || "21:00"
    );
    
    if (dayAvailability?.availableSlots?.length > 0) {
      const availableStartTimes = dayAvailability.availableSlots.map(slot => slot.start);
      return allSlots.filter(slot => availableStartTimes.includes(slot));
    }
    
    return allSlots;
  }, [bookingData.date, listing?.operatingHours, availabilityData]);

  const endSlots = useMemo(() => {
    if (!bookingData.startTime || !listing?.operatingHours) return [];
    
    const operatingHours = getOperatingHoursForDate(new Date(bookingData.date), listing.operatingHours);
    if (!operatingHours) return [];
    
    return generateTimeSlots(
      operatingHours.start || "09:00",
      operatingHours.end || "21:00",
      bookingData.startTime
    ).filter((time) => {
      const [startH, startM] = bookingData.startTime.split(":").map(Number);
      const [endH, endM] = time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes - startMinutes >= 60;
    });
  }, [bookingData.startTime, bookingData.date, listing?.operatingHours]);

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const [startH, startM] = bookingData.startTime.split(":").map(Number);
    const [endH, endM] = bookingData.endTime.split(":").map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  };

  const calculateTotal = () => {
    const hours = calculateDuration();
    const basePrice = hours * (listing?.hourlyRate || listing?.price || 0);
    const guestSurcharge = Math.max(0, bookingData.guests - (listing?.includedGuests || 10)) * (listing?.extraGuestCharge || 0);
    return basePrice + guestSurcharge;
  };

  const quickSelectGuests = (count) => {
    setBookingData({ ...bookingData, guests: count });
    setShowGuests(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-stone-200">
      {/* Price Header */}
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-stone-900">
            ${listing?.hourlyRate || listing?.price}
          </span>
          <span className="text-stone-600">/ hour</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Free cancellation up to 24 hours</span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="p-6 space-y-4">
        {/* Date Picker */}
        <div ref={calendarRef} className="relative">
          <label className="block text-sm font-bold text-stone-900 mb-2">📅 Date</label>
          <button
            type="button"
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowTimeSlots(false);
              setShowGuests(false);
            }}
            className={`w-full p-4 rounded-xl text-left font-medium transition-all border ${
              bookingData.date
                ? "border-emerald-500 bg-emerald-50"
                : "border-stone-200 hover:border-emerald-400 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={bookingData.date ? "text-emerald-700" : "text-stone-600"}>
                {formatSelectedDate()}
              </span>
              <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </button>

          {showCalendar && (
            <Calendar
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              availabilityData={availabilityData}
              bookingData={bookingData}
              setBookingData={setBookingData}
              setShowCalendar={setShowCalendar}
              setShowTimeSlots={setShowTimeSlots}
            />
          )}
        </div>

        {/* Time Slots */}
        <div ref={timeSlotsRef} className="relative">
          <label className="block text-sm font-bold text-stone-900 mb-2">⏰ Time</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setShowTimeSlots(showTimeSlots === "start" ? false : "start");
                setShowCalendar(false);
                setShowGuests(false);
              }}
              className={`w-full p-3 rounded-lg font-medium text-sm transition-all border flex items-center justify-between h-12 ${
                bookingData.startTime
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-stone-200 hover:border-emerald-400 text-stone-600"
              }`}
            >
              <span className="truncate">{bookingData.startTime || "Start"}</span>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTimeSlots(showTimeSlots === "end" ? false : "end");
                setShowCalendar(false);
                setShowGuests(false);
              }}
              disabled={!bookingData.startTime}
              className={`w-full p-3 rounded-lg font-medium text-sm transition-all border flex items-center justify-between h-12 ${
                bookingData.endTime
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : !bookingData.startTime
                  ? "border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed"
                  : "border-stone-200 hover:border-emerald-400 text-stone-600"
              }`}
            >
              <span className="truncate">{bookingData.endTime || "End"}</span>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showTimeSlots && (showTimeSlots === "start" ? startSlots : endSlots).length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-50 max-h-80 overflow-y-auto">
              <div className="text-xs text-stone-500 font-medium mb-3">Available time slots</div>
              <div className="grid grid-cols-3 gap-2">
                {(showTimeSlots === "start" ? startSlots : endSlots).map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setBookingData((prev) => ({
                        ...prev,
                        [showTimeSlots === "start" ? "startTime" : "endTime"]: time,
                        ...(showTimeSlots === "start" ? { endTime: "" } : {}),
                      }));
                      setShowTimeSlots(false);
                    }}
                    className={`p-2 text-sm font-medium rounded-lg transition-colors ${
                      (showTimeSlots === "start" && bookingData.startTime === time) || 
                      (showTimeSlots === "end" && bookingData.endTime === time)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
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
          <label className="block text-sm font-bold text-stone-900 mb-2">👥 Guests</label>
          <button
            type="button"
            onClick={() => {
              setShowGuests(!showGuests);
              setShowCalendar(false);
              setShowTimeSlots(false);
            }}
            className="w-full p-4 rounded-xl text-left font-medium transition-all border border-stone-200 hover:border-emerald-400 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-stone-700">
                {bookingData.guests} guest{bookingData.guests !== 1 ? "s" : ""}
              </span>
              <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showGuests && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 p-6 z-50">
              <div className="mb-4">
                <p className="text-sm text-stone-600 mb-3">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 4, 6, 8, 10].map((count) => (
                    <button
                      key={count}
                      onClick={() => quickSelectGuests(count)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        bookingData.guests === count
                          ? "bg-emerald-500 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <button
                  onClick={() => setBookingData((prev) => ({
                    ...prev,
                    guests: Math.max(listing?.minCapacity || 1, prev.guests - 1),
                  }))}
                  disabled={bookingData.guests <= (listing?.minCapacity || 1)}
                  className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-3xl font-bold text-stone-900">{bookingData.guests}</div>
                  <div className="text-sm text-stone-600">guests</div>
                </div>
                <button
                  onClick={() => setBookingData((prev) => ({
                    ...prev,
                    guests: Math.min(listing?.capacity || 100, prev.guests + 1),
                  }))}
                  disabled={bookingData.guests >= (listing?.capacity || 100)}
                  className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {listing?.capacity && (
                <p className="text-xs text-stone-500 text-center mt-4">
                  Maximum: {listing.capacity} guests
                </p>
              )}
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        {calculateDuration() > 0 && (
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">
                ${listing?.hourlyRate || listing?.price} × {calculateDuration()} hours
              </span>
              <span className="font-medium">
                ${(listing?.hourlyRate || listing?.price) * calculateDuration()}
              </span>
            </div>

            {listing?.extraGuestCharge && bookingData.guests > (listing?.includedGuests || 10) && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Extra guests</span>
                <span className="font-medium">
                  ${(bookingData.guests - (listing?.includedGuests || 10)) * listing.extraGuestCharge}
                </span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold pt-3 border-t border-stone-200">
              <span>Total</span>
              <span className="text-emerald-600">${calculateTotal()}</span>
            </div>
          </div>
        )}

        {/* Book Button */}
        {isOwnListing ? (
          <div className="w-full py-4 rounded-xl font-bold text-center bg-stone-100 text-stone-500 border border-stone-200">
            <p className="text-sm">This is your listing</p>
            <p className="text-xs mt-1">You cannot book your own space</p>
          </div>
        ) : (
          <button
            onClick={handleBooking}
            disabled={!bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Reserve Now"
            )}
          </button>
        )}

        {/* Security Message */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}