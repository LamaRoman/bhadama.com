"use client";

import { useState } from "react";

const DAYS = [
  { key: "sunday", label: "Sunday", short: "Sun" },
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
];

const DEFAULT_DAY = {
  start: "09:00",
  end: "21:00",
  closed: false,
  is24Hours: false,
};

// Generate time options for dropdowns (every 30 minutes)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Format time for display (e.g., "09:00" -> "9:00 AM")
const formatTimeDisplay = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

export default function OperatingHoursInput({ 
  operatingHours, 
  onChange,
  showCopyToAll = true,
  compact = false 
}) {
  const [expandedDay, setExpandedDay] = useState(null);

  // Initialize with defaults if empty
  const hours = operatingHours || DAYS.reduce((acc, day) => {
    acc[day.key] = { ...DEFAULT_DAY };
    return acc;
  }, {});

  const handleDayChange = (dayKey, field, value) => {
    const currentDay = hours[dayKey] || { ...DEFAULT_DAY };
    
    let updatedDay = { ...currentDay, [field]: value };

    // Handle state transitions
    if (field === "is24Hours" && value === true) {
      // When enabling 24 hours, set times to 00:00 and ensure not closed
      updatedDay = {
        ...updatedDay,
        start: "00:00",
        end: "00:00",
        closed: false,
      };
    }

    if (field === "closed" && value === true) {
      // When closing a day, disable 24 hours
      updatedDay = {
        ...updatedDay,
        is24Hours: false,
      };
    }

    const updated = {
      ...hours,
      [dayKey]: updatedDay,
    };

    onChange(updated);
  };

  const copyToAllDays = (sourceDayKey) => {
    const sourceDay = hours[sourceDayKey];
    if (!sourceDay) return;

    const updated = DAYS.reduce((acc, day) => {
      acc[day.key] = { ...sourceDay };
      return acc;
    }, {});

    onChange(updated);
  };

  const getStatusBadge = (dayData) => {
    if (!dayData || dayData.closed) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          Closed
        </span>
      );
    }
    if (dayData.is24Hours) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Open 24 Hours
        </span>
      );
    }
    return (
      <span className="text-sm text-gray-600">
        {formatTimeDisplay(dayData.start)} - {formatTimeDisplay(dayData.end)}
      </span>
    );
  };

  // Compact view for mobile or smaller spaces
  if (compact) {
    return (
      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayData = hours[day.key] || { ...DEFAULT_DAY };
          
          return (
            <div
              key={day.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-900 w-20">{day.short}</span>
              
              <div className="flex items-center gap-2">
                {/* Closed Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayData.closed}
                    onChange={(e) => handleDayChange(day.key, "closed", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-xs text-gray-500">Closed</span>
                </label>

                {/* 24 Hours Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayData.is24Hours}
                    disabled={dayData.closed}
                    onChange={(e) => handleDayChange(day.key, "is24Hours", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-500">24h</span>
                </label>

                {/* Time Selects */}
                {!dayData.closed && !dayData.is24Hours && (
                  <div className="flex items-center gap-1">
                    <select
                      value={dayData.start}
                      onChange={(e) => handleDayChange(day.key, "start", e.target.value)}
                      className="text-xs p-1 border border-gray-200 rounded"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400">-</span>
                    <select
                      value={dayData.end}
                      onChange={(e) => handleDayChange(day.key, "end", e.target.value)}
                      className="text-xs p-1 border border-gray-200 rounded"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const dayData = hours[day.key] || { ...DEFAULT_DAY };
        const isExpanded = expandedDay === day.key;

        return (
          <div
            key={day.key}
            className={`border rounded-xl transition-all ${
              dayData.closed
                ? "border-gray-200 bg-gray-50"
                : dayData.is24Hours
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Day Header - Always Visible */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setExpandedDay(isExpanded ? null : day.key)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 w-28">{day.label}</span>
                {getStatusBadge(dayData)}
              </div>

              <div className="flex items-center gap-2">
                {showCopyToAll && !isExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToAllDays(day.key);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                    title="Copy this schedule to all days"
                  >
                    Copy to all
                  </button>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Expanded Controls */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-4">
                  {/* Closed Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={dayData.closed}
                        onChange={(e) => handleDayChange(day.key, "closed", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-gray-600 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Closed</span>
                  </label>

                  {/* 24 Hours Toggle */}
                  <label
                    className={`flex items-center gap-2 cursor-pointer select-none ${
                      dayData.closed ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={dayData.is24Hours}
                        disabled={dayData.closed}
                        onChange={(e) => handleDayChange(day.key, "is24Hours", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 peer-disabled:bg-gray-100 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Open 24 Hours</span>
                  </label>
                </div>

                {/* Time Selection */}
                {!dayData.closed && !dayData.is24Hours && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Opens at
                      </label>
                      <select
                        value={dayData.start}
                        onChange={(e) => handleDayChange(day.key, "start", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Closes at
                      </label>
                      <select
                        value={dayData.end}
                        onChange={(e) => handleDayChange(day.key, "end", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 24 Hours Info */}
                {dayData.is24Hours && (
                  <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Available for booking any time of day</span>
                  </div>
                )}

                {/* Copy to All Button */}
                {showCopyToAll && (
                  <button
                    type="button"
                    onClick={() => copyToAllDays(day.key)}
                    className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                  >
                    Apply this schedule to all days
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            const allSameHours = DAYS.reduce((acc, day) => {
              acc[day.key] = { start: "09:00", end: "21:00", closed: false, is24Hours: false };
              return acc;
            }, {});
            onChange(allSameHours);
          }}
          className="flex-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          Reset to Default (9AM - 9PM)
        </button>
        <button
          type="button"
          onClick={() => {
            const all24Hours = DAYS.reduce((acc, day) => {
              acc[day.key] = { start: "00:00", end: "00:00", closed: false, is24Hours: true };
              return acc;
            }, {});
            onChange(all24Hours);
          }}
          className="flex-1 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
        >
          Set All to 24 Hours
        </button>
      </div>
    </div>
  );
}

// Export helper for displaying operating hours (for listing detail pages)
export function OperatingHoursDisplay({ operatingHours, compact = false }) {
  if (!operatingHours) return null;

  const formatDayHours = (dayData) => {
    if (!dayData || dayData.closed) return "Closed";
    if (dayData.is24Hours) return "Open 24 Hours";
    
    const formatTime = (time) => {
      if (!time) return "";
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
    };
    
    return `${formatTime(dayData.start)} - ${formatTime(dayData.end)}`;
  };

  const days = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ];

  // Check if all days have same hours
  const allSame = days.every((day) => {
    const first = operatingHours[days[0].key];
    const current = operatingHours[day.key];
    return (
      first?.start === current?.start &&
      first?.end === current?.end &&
      first?.closed === current?.closed &&
      first?.is24Hours === current?.is24Hours
    );
  });

  if (compact && allSame) {
    const firstDay = operatingHours[days[0].key];
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">Every day:</span> {formatDayHours(firstDay)}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {days.map((day) => {
        const dayData = operatingHours[day.key];
        const hoursText = formatDayHours(dayData);
        
        return (
          <div
            key={day.key}
            className={`flex justify-between text-sm ${
              dayData?.closed ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <span className="font-medium">{day.label}</span>
            <span className={dayData?.is24Hours ? "text-green-600 font-medium" : ""}>
              {hoursText}
            </span>
          </div>
        );
      })}
    </div>
  );
}