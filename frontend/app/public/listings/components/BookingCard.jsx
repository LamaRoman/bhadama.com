"use client";

import { useMemo } from "react";
import { toast } from "react-hot-toast";
import Calendar from "./Calendar";
import { 
  DAYS,
  MONTHS,
  DAY_NAMES,
  formatDateLocal,
  formatDateDisplay,
  timeToMinutes,
  formatMinutesToTime,
  formatMinutesToRange,
  formatTimeSlotRanges,
  generateTimeSlots,
  getOperatingHoursForDate,
  is24HoursOnDate,
  isClosedOnDate,
  formatOperatingHours,
  getOperatingHoursSummary,
} from "./utils";

import PaymentLogos from "./PaymentLogos";
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
  // ✅ Parse base rate and discounts
  const baseRate = parseFloat(listing?.hourlyRate) || 0;
  const flatDiscountPercent = parseFloat(listing?.discountPercent) || 0;
  const discountReason = listing?.discountReason || null;
  const bonusOffer = listing?.bonusHoursOffer || null;
  const durationTiers = listing?.durationDiscounts?.tiers || [];

  // ✅ Calculate discounted base rate (if flat discount exists)
  const discountedBaseRate = useMemo(() => {
    if (flatDiscountPercent > 0) {
      return baseRate * (1 - flatDiscountPercent / 100);
    }
    return baseRate;
  }, [baseRate, flatDiscountPercent]);

  const formatSelectedDate = () => {
    if (!bookingData.date) return "Select date";
    return formatDateDisplay(new Date(bookingData.date));
  };

  // ✅ Get effective hourly rate for selected date (special pricing or discounted rate)
  const effectiveRate = useMemo(() => {
    if (!bookingData.date) return discountedBaseRate;
    
    const dayAvailability = availabilityData[bookingData.date];
    if (dayAvailability?.specialPricing?.hourlyRate) {
      return parseFloat(dayAvailability.specialPricing.hourlyRate);
    }
    return discountedBaseRate;
  }, [bookingData.date, availabilityData, discountedBaseRate]);

  // ✅ Check if selected date has special pricing AND it's a discount
  const hasSpecialDiscount = useMemo(() => {
    if (!bookingData.date) return false;
    const specialPricing = availabilityData[bookingData.date]?.specialPricing;
    return specialPricing && parseFloat(specialPricing.hourlyRate) < discountedBaseRate;
  }, [bookingData.date, availabilityData, discountedBaseRate]);

  const specialPricingReason = useMemo(() => {
    if (!bookingData.date) return null;
    return availabilityData[bookingData.date]?.specialPricing?.reason || null;
  }, [bookingData.date, availabilityData]);

  const savingsPerHour = useMemo(() => {
    if (!hasSpecialDiscount) return 0;
    return discountedBaseRate - effectiveRate;
  }, [hasSpecialDiscount, discountedBaseRate, effectiveRate]);

 const startSlots = useMemo(() => {
  if (!bookingData.date || !listing?.operatingHours) return [];
  
  const dateObj = new Date(bookingData.date);
  const dayAvailability = availabilityData[bookingData.date];
  const operatingHours = getOperatingHoursForDate(dateObj, listing.operatingHours);
  
  // Check if closed
  if (!operatingHours || operatingHours.closed) return [];
  
  // Check if 24 hours
  const is24Hours = operatingHours.is24Hours || is24HoursOnDate(dateObj, listing.operatingHours);
  
  // Generate all possible slots
  const allSlots = generateTimeSlots(
    operatingHours.start || "00:00",
    operatingHours.end || "23:59",
    null,
    is24Hours  // Pass is24Hours flag
  );
  
  // ✅ ADDED: Filter out past times if selected date is today
  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();
  
  let availableSlots = allSlots;
  
  if (isToday) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    availableSlots = allSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotMinutes = hours * 60 + minutes;
      return slotMinutes > currentMinutes; // Only future times
    });
  }
  
  // Filter by availability if data exists
  if (dayAvailability?.availableSlots?.length > 0) {
    const availableStartTimes = dayAvailability.availableSlots.map(slot => slot.start);
    return availableSlots.filter(slot => availableStartTimes.includes(slot));
  }
  
  return availableSlots;
}, [bookingData.date, listing?.operatingHours, availabilityData]);

const endSlots = useMemo(() => {
  if (!bookingData.startTime || !listing?.operatingHours || !bookingData.date) return [];
  
  const dateObj = new Date(bookingData.date);
  const operatingHours = getOperatingHoursForDate(dateObj, listing.operatingHours);
  
  if (!operatingHours || operatingHours.closed) return [];
  
  // Check if 24 hours
  const is24Hours = operatingHours.is24Hours || is24HoursOnDate(dateObj, listing.operatingHours);
  
  // Generate slots starting from the selected start time
  const allSlots = generateTimeSlots(
    operatingHours.start || "00:00",
    operatingHours.end || "23:59",
    bookingData.startTime,  // Filter from selected start time
    is24Hours
  );
  
  // Filter to only include times at least 1 hour after start
  return allSlots.filter((time) => {
    const [startH, startM] = bookingData.startTime.split(":").map(Number);
    const [endH, endM] = time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return endMinutes - startMinutes >= 60; // Minimum 1 hour booking
  });
}, [bookingData.startTime, bookingData.date, listing?.operatingHours]);

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const [startH, startM] = bookingData.startTime.split(":").map(Number);
    const [endH, endM] = bookingData.endTime.split(":").map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  };

  const duration = calculateDuration();

  // ✅ COMPREHENSIVE PRICING CALCULATION
  const pricing = useMemo(() => {
    if (duration === 0) {
      return { 
        total: 0, 
        type: 'none',
        baseAmount: 0,
        flatDiscountAmount: 0,
        durationDiscountAmount: 0,
        durationDiscountPercent: 0,
        discountTier: null,
        bonusHours: 0,
        guestSurcharge: 0,
        extraGuests: 0,
        totalHours: 0,
      };
    }

    let result = {
      total: 0,
      type: 'hourly',
      baseAmount: 0,
      flatDiscountAmount: 0,
      durationDiscountAmount: 0,
      durationDiscountPercent: 0,
      discountTier: null,
      bonusHours: 0,
      guestSurcharge: 0,
      extraGuests: 0,
      totalHours: duration,
    };

    // Calculate base price at full rate (before any discounts)
    const fullBaseAmount = duration * baseRate;
    result.baseAmount = fullBaseAmount;

    // Apply flat discount first
    if (flatDiscountPercent > 0) {
      result.flatDiscountAmount = fullBaseAmount * (flatDiscountPercent / 100);
      result.type = 'flat-discount';
    }

    // Amount after flat discount
    const afterFlatDiscount = fullBaseAmount - result.flatDiscountAmount;

    // Find applicable duration discount tier (applies to already-discounted price)
    if (durationTiers.length > 0) {
      const sorted = [...durationTiers].sort((a, b) => b.minHours - a.minHours);
      const applicableTier = sorted.find(t => duration >= t.minHours);
      
      if (applicableTier) {
        result.discountTier = applicableTier;
        result.durationDiscountPercent = applicableTier.discountPercent;
        result.durationDiscountAmount = afterFlatDiscount * (applicableTier.discountPercent / 100);
        result.type = 'combined-discount';
      }
    }

    // Calculate total after both discounts
    result.total = afterFlatDiscount - result.durationDiscountAmount;

    // Apply bonus hours (doesn't affect price, just adds value)
    if (bonusOffer?.minHours && bonusOffer?.bonusHours && duration >= bonusOffer.minHours) {
      result.bonusHours = bonusOffer.bonusHours;
      result.totalHours = duration + bonusOffer.bonusHours;
    }

    // Add guest surcharge
    const extraGuests = Math.max(0, bookingData.guests - (listing?.includedGuests || 10));
    const guestSurcharge = extraGuests * parseFloat(listing?.extraGuestCharge || 0);
    
    result.total += guestSurcharge;
    result.guestSurcharge = guestSurcharge;
    result.extraGuests = extraGuests;

    return result;
  }, [
    duration, 
    baseRate,
    flatDiscountPercent,
    durationTiers,
    bonusOffer, 
    bookingData.guests, 
    listing?.includedGuests, 
    listing?.extraGuestCharge
  ]);

  const quickSelectGuests = (count) => {
    setBookingData({ ...bookingData, guests: count });
    setShowGuests(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-stone-200">
      {/* Price Header */}
      <div className="p-6 border-b border-stone-200">
        {/* Main Hourly Rate Display */}
        <div className="flex items-baseline gap-2 mb-1">
          {flatDiscountPercent > 0 ? (
            <>
              <span className="text-4xl font-bold text-red-600">
                Rs.{discountedBaseRate.toFixed(0)}
              </span>
              <span className="text-xl text-stone-400 line-through">
                Rs.{baseRate}
              </span>
              <span className="text-stone-600">/ hour</span>
            </>
          ) : hasSpecialDiscount ? (
            <>
              <span className="text-4xl font-bold text-purple-600">
                Rs.{effectiveRate}
              </span>
              <span className="text-xl text-stone-400 line-through">
                Rs.{baseRate}
              </span>
              <span className="text-stone-600">/ hour</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold text-stone-900">
                Rs.{baseRate}
              </span>
              <span className="text-stone-600">/ hour</span>
            </>
          )}
        </div>
        
        {/* Flat Discount Badge */}
        {flatDiscountPercent > 0 && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
            <span className="text-red-500">🔥</span>
            <span className="text-sm font-medium text-red-700">
              {discountReason || `${flatDiscountPercent}% OFF`}
            </span>
            <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              Save Rs.{(baseRate - discountedBaseRate).toFixed(0)}/hr
            </span>
          </div>
        )}

        {/* Special Discount Badge - Only when lower */}
        {hasSpecialDiscount && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-purple-500">★</span>
            <span className="text-sm font-medium text-purple-700">
              {specialPricingReason || "Special Rate"}
            </span>
            <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              Save Rs.{savingsPerHour}/hr
            </span>
          </div>
        )}

        {/* ✅ Duration Discount Tiers Display */}
        {(durationTiers.length > 0 || bonusOffer) && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Special Offers
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              {/* Duration Discount Tiers */}
              {durationTiers.map((tier, index) => {
                const isActive = pricing.discountTier?.minHours === tier.minHours;
                return (
                  <div 
                    key={index}
                    className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-100 to-purple-100 border-violet-400 ring-2 ring-violet-400' 
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800">
                          {tier.label || `${tier.minHours}+ Hours`}
                        </p>
                        <p className="text-xs text-stone-500">Book {tier.minHours}+ hours</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-violet-700">{tier.discountPercent}% OFF</p>
                      {duration >= tier.minHours && (
                        <p className="text-xs text-green-600">
                          Save Rs.{pricing.durationDiscountAmount.toFixed(0)}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute -top-2 -right-2 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        APPLIED
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bonus Hours Offer */}
              {bonusOffer?.minHours && bonusOffer?.bonusHours && (
                <div className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                  pricing.bonusHours > 0 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 ring-2 ring-green-400' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">Bonus Hours</p>
                      <p className="text-xs text-stone-500">
                        Book {bonusOffer.minHours}+ hrs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">
                      +{bonusOffer.bonusHours} hr FREE
                    </p>
                    <p className="text-xs text-green-600">
                      Rs.{(bonusOffer.bonusHours * baseRate).toFixed(0)} value
                    </p>
                  </div>
                  {pricing.bonusHours > 0 && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      APPLIED
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-stone-600 mt-3">
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
                ? hasSpecialDiscount
                  ? "border-purple-500 bg-purple-50"
                  : flatDiscountPercent > 0
                  ? "border-red-500 bg-red-50"
                  : "border-emerald-500 bg-emerald-50"
                : "border-stone-200 hover:border-emerald-400 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className={bookingData.date ? (hasSpecialDiscount ? "text-purple-700" : flatDiscountPercent > 0 ? "text-red-700" : "text-emerald-700") : "text-stone-600"}>
                  {formatSelectedDate()}
                </span>
                {bookingData.date && (
                  <span className={`ml-2 text-sm ${hasSpecialDiscount ? "text-purple-600 font-semibold" : flatDiscountPercent > 0 ? "text-red-600 font-semibold" : "text-stone-500"}`}>
                    (Rs.{effectiveRate}/hr)
                  </span>
                )}
              </div>
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
              baseHourlyRate={baseRate}
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
                  className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50 flex items-center justify-center text-lg"
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
                  className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50 flex items-center justify-center text-lg"
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
        {is24HoursOnDate(new Date(bookingData.date), listing?.operatingHours) && (
  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="text-sm font-medium">Open 24 Hours</span>
  </div>
)}

        {/* ✅ COMPLETE Price Breakdown */}
        {duration > 0 && (
          <div className="pt-4 border-t border-stone-200 space-y-3">
            {/* Base hourly calculation */}
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">
                Rs.{baseRate} × {duration} hour{duration !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">Rs.{pricing.baseAmount.toFixed(0)}</span>
            </div>

            {/* Flat Discount - Show if applied */}
            {pricing.flatDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {discountReason || 'Discount'} ({flatDiscountPercent}% off)
                </span>
                <span className="font-medium">-Rs.{pricing.flatDiscountAmount.toFixed(0)}</span>
              </div>
            )}

            {/* Duration Discount - Show if applied */}
            {pricing.durationDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-violet-600 bg-violet-50 px-3 py-2 rounded-lg border border-violet-200">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {pricing.discountTier?.label || 'Duration discount'} ({pricing.durationDiscountPercent}% off)
                </span>
                <span className="font-medium">-Rs.{pricing.durationDiscountAmount.toFixed(0)}</span>
              </div>
            )}

            {/* Special Date Savings */}
            {hasSpecialDiscount && (
              <div className="flex justify-between text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <span className="flex items-center gap-1">
                  <span>★</span>
                  Special date savings
                </span>
                <span className="font-medium">-Rs.{(savingsPerHour * duration).toFixed(0)}</span>
              </div>
            )}

            {/* Bonus Hours */}
            {pricing.bonusHours > 0 && (
              <div className="flex justify-between items-center text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <span className="flex items-center gap-2 text-green-700">
                  <span>🎁</span>
                  <span className="font-medium">
                    +{pricing.bonusHours} Bonus Hour{pricing.bonusHours > 1 ? 's' : ''} FREE
                  </span>
                </span>
                <span className="text-green-600 text-xs">
                  Rs.{(pricing.bonusHours * baseRate).toFixed(0)} value
                </span>
              </div>
            )}

            {/* Extra Guests */}
            {pricing.guestSurcharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">
                  Extra guests ({pricing.extraGuests})
                </span>
                <span className="font-medium">+Rs.{pricing.guestSurcharge.toFixed(0)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-stone-200">
              <span>Total</span>
              <div className="text-right">
                <span className={
                  pricing.type === 'combined-discount' ? "text-violet-600" :
                  pricing.type === 'flat-discount' ? "text-red-600" :
                  hasSpecialDiscount ? "text-purple-600" : "text-emerald-600"
                }>
                  Rs.{pricing.total.toFixed(0)}
                </span>
                {pricing.bonusHours > 0 && (
                  <p className="text-xs font-normal text-green-600">
                    {pricing.totalHours} hours total (incl. {pricing.bonusHours} bonus)
                  </p>
                )}
              </div>
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
                : pricing.type === 'combined-discount'
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  : pricing.type === 'flat-discount'
                    ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    : hasSpecialDiscount
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Security */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
            
            <PaymentLogos />
          </div>
        </div>
      </div>
      {/* Accepted Payment Methods */}

    </div>
  );
}