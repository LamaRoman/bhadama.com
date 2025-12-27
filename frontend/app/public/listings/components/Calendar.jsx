"use client";

import { toast } from "react-hot-toast";
import { DAYS, MONTHS, formatDateLocal, formatDateDisplay, formatTimeSlotRanges } from "./utils";

export default function Calendar({
  currentMonth,
  setCurrentMonth,
  availabilityData,
  bookingData,
  setBookingData,
  setShowCalendar,
  setShowTimeSlots,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    return { days: lastDay, start: firstDayOfWeek };
  };

  const selectDate = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    selectedDate.setHours(0, 0, 0, 0);
    
    const dateStr = formatDateLocal(selectedDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < todayDate) {
      toast.error("Cannot select past dates");
      return;
    }
    
    const dayAvailability = availabilityData[dateStr];
    
    if (!dayAvailability) {
      toast.error("No availability data for this date");
      return;
    }
    
    if (dayAvailability.status === 'blocked' || dayAvailability.status === 'closed') {
      const reason = dayAvailability.status === 'blocked' ? 'Blocked' : 'Closed';
      toast.error(`This date is ${reason.toLowerCase()}`);
      return;
    }
    
    if (dayAvailability.status === 'fully-booked') {
      toast.error("This date is fully booked");
      return;
    }
    
    if (dayAvailability.status === 'partially-booked') {
      const availableCount = dayAvailability.availableCount || 0;
      const availableRanges = formatTimeSlotRanges(dayAvailability.availableSlots || []);
      const bookedRanges = formatTimeSlotRanges(dayAvailability.bookedSlots || []);
      
      toast(
        <div className="text-left max-w-sm">
          <p className="font-bold mb-2 text-amber-700">⚠️ Partial Availability</p>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-stone-700 mb-1">Available:</p>
              <div className="flex flex-wrap gap-1">
                {availableRanges.map((range, idx) => (
                  <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">
                    {range}
                  </span>
                ))}
              </div>
            </div>
            {bookedRanges.length > 0 && (
              <div>
                <p className="text-sm font-medium text-stone-700 mb-1">Booked:</p>
                <div className="flex flex-wrap gap-1">
                  {bookedRanges.map((range, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded line-through">
                      {range}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        { duration: 5000, style: { background: '#fffbeb', border: '1px solid #f59e0b' } }
      );
    }

    setBookingData({
      ...bookingData,
      date: dateStr,
      startTime: "",
      endTime: "",
    });
    setShowCalendar(false);
    
    setTimeout(() => setShowTimeSlots("start"), 100);
    toast.success(`Selected ${formatDateDisplay(selectedDate)}`);
  };

  const { days, start } = daysInMonth();

  return (
    <div className="mt-2 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-xl border border-stone-200 p-6 animate-in fade-in-0 zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:scale-110 transition-all"
        >
          <svg className="w-5 h-5 text-stone-400 hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {MONTHS[currentMonth.getMonth()]}
          </h3>
          <p className="text-sm text-stone-500 font-medium">{currentMonth.getFullYear()}</p>
        </div>

        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:scale-110 transition-all"
        >
          <svg className="w-5 h-5 text-stone-400 hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS.map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-stone-500 py-1">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(start)].map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {[...Array(days)].map((_, i) => {
          const day = i + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          date.setHours(0, 0, 0, 0);
          
          const dateStr = formatDateLocal(date);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          const isPast = date < todayDate;
          const isToday = date.getTime() === todayDate.getTime();
          const selected = bookingData.date === dateStr;

          const dayAvailability = availabilityData[dateStr];
          let bgColor = "bg-stone-50 hover:bg-stone-100";
          let textColor = "text-stone-800";
          let borderColor = "border-stone-200";
          let availabilityStatus = "available";

          if (isPast) {
            bgColor = "bg-stone-100";
            textColor = "text-stone-400";
            availabilityStatus = "past";
          } else if (dayAvailability) {
            if (dayAvailability.status === "blocked" || dayAvailability.status === "closed") {
              bgColor = "bg-red-50/50";
              textColor = "text-red-500";
              borderColor = "border-red-200";
              availabilityStatus = "unavailable";
            } else if (dayAvailability.status === "fully-booked") {
              bgColor = "bg-red-50/50";
              textColor = "text-red-500";
              borderColor = "border-red-200";
              availabilityStatus = "fully-booked";
            } else if (dayAvailability.status === "partially-booked") {
              bgColor = "bg-amber-50/50 hover:bg-amber-50";
              textColor = "text-amber-700";
              borderColor = "border-amber-200";
              availabilityStatus = "partially-booked";
            } else if (dayAvailability.status === "available") {
              bgColor = "bg-emerald-50/50 hover:bg-emerald-100/50";
              textColor = "text-emerald-700";
              borderColor = "border-emerald-200";
            }
          }
          
          const isDisabled = isPast || availabilityStatus === "unavailable" || availabilityStatus === "fully-booked";

          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              disabled={isDisabled}
              className={`
                aspect-square w-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center
                ${bgColor} ${textColor} ${borderColor} border
                ${isToday && !selected ? "ring-2 ring-emerald-400 ring-offset-1" : ""}
                ${selected ? "!bg-gradient-to-br from-emerald-500 to-teal-500 !text-white !border-emerald-500 shadow-md scale-105" : ""}
                ${!isDisabled ? "hover:scale-105 hover:shadow-sm active:scale-95" : "cursor-not-allowed opacity-60"}
              `}
            >
              <span className={`text-sm font-semibold ${selected ? "text-white" : ""}`}>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-stone-200">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-50/50 border border-emerald-200"></div>
            <span className="text-stone-600">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-50/50 border border-amber-200"></div>
            <span className="text-stone-600">Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-50/50 border border-red-200"></div>
            <span className="text-stone-600">Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}