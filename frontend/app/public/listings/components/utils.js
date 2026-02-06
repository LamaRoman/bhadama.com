// Utility functions and constants for listing page
// Updated with 24-hour venue support

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const formatMinutesToRange = (startMinutes, endMinutes) => {
  const startTime = formatMinutesToTime(startMinutes);
  const endTime = formatMinutesToTime(endMinutes);
  return `${startTime} - ${endTime}`;
};

export const formatTimeSlotRanges = (slots) => {
  if (!slots || slots.length === 0) return [];
  
  const sortedSlots = [...slots].sort((a, b) => 
    timeToMinutes(a.start) - timeToMinutes(b.start)
  );
  
  const ranges = [];
  let currentRange = null;
  
  sortedSlots.forEach((slot, index) => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    
    if (!currentRange) {
      currentRange = { start: slotStart, end: slotEnd };
    } else {
      if (slotStart === currentRange.end) {
        currentRange.end = slotEnd;
      } else {
        ranges.push(formatMinutesToRange(currentRange.start, currentRange.end));
        currentRange = { start: slotStart, end: slotEnd };
      }
    }
    
    if (index === sortedSlots.length - 1) {
      ranges.push(formatMinutesToRange(currentRange.start, currentRange.end));
    }
  });
  
  return ranges;
};

/**
 * Generate time slots between start and end times
 * 
 * @param {string} start - Start time in HH:MM format
 * @param {string} end - End time in HH:MM format
 * @param {string|null} minStart - Minimum start time (for filtering)
 * @param {boolean} is24Hours - If true, generates full 24-hour slots (00:00 to 23:30)
 * @returns {string[]} Array of time slots in HH:MM format
 */
export const generateTimeSlots = (start, end, minStart = null, is24Hours = false) => {
  const slots = [];
  
  let startH, startM, endH, endM;
  
  if (is24Hours) {
    // 24-hour venue: generate slots from 00:00 to 23:30
    startH = 0;
    startM = 0;
    endH = 24;  // Will stop at 23:30
    endM = 0;
  } else {
    if (!start || !end) return [];
    
    [startH, startM] = start.split(":").map(Number);
    [endH, endM] = end.split(":").map(Number);
  }

  // Apply minimum start filter if provided
  if (minStart) {
    const [minH, minM] = minStart.split(":").map(Number);
    if (startH < minH || (startH === minH && startM < minM)) {
      startH = minH;
      startM = minM;
    }
  }

  // Generate slots every 30 minutes
  while (startH < endH || (startH === endH && startM < endM)) {
    // For 24-hour venues, stop at 23:30 (last bookable slot)
    if (is24Hours && startH >= 24) break;
    
    const hStr = String(startH).padStart(2, "0");
    const mStr = String(startM).padStart(2, "0");
    slots.push(`${hStr}:${mStr}`);

    startM += 30;
    if (startM >= 60) {
      startH += 1;
      startM = 0;
    }
  }

  return slots;
};

/**
 * Get operating hours for a specific date
 * Handles 24-hour venues and closed days
 * 
 * @param {Date} date - The date to get operating hours for
 * @param {Object} operatingHours - The operating hours object from listing
 * @returns {Object|null} Operating hours for the day, or null if invalid
 * 
 * Example return values:
 * - Regular day: { start: "09:00", end: "21:00", closed: false, is24Hours: false }
 * - 24-hour day: { start: "00:00", end: "23:59", closed: false, is24Hours: true }
 * - Closed day: { closed: true, is24Hours: false }
 */
export const getOperatingHoursForDate = (date, operatingHours) => {
  if (!operatingHours) return null;
  
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = operatingHours[dayName];
  
  if (!dayHours) return null;
  
  // Handle 24-hour venues
  if (dayHours.is24Hours && !dayHours.closed) {
    return {
      start: "00:00",
      end: "23:59",
      closed: false,
      is24Hours: true,
    };
  }
  
  // Return as-is for regular or closed days
  return dayHours;
};

/**
 * Check if a venue is open 24 hours on a specific date
 * 
 * @param {Date} date - The date to check
 * @param {Object} operatingHours - The operating hours object from listing
 * @returns {boolean} True if open 24 hours
 */
export const is24HoursOnDate = (date, operatingHours) => {
  if (!operatingHours) return false;
  
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = operatingHours[dayName];
  
  return dayHours?.is24Hours === true && !dayHours?.closed;
};

/**
 * Check if a venue is closed on a specific date
 * 
 * @param {Date} date - The date to check
 * @param {Object} operatingHours - The operating hours object from listing
 * @returns {boolean} True if closed
 */
export const isClosedOnDate = (date, operatingHours) => {
  if (!operatingHours) return false;
  
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = operatingHours[dayName];
  
  return dayHours?.closed === true;
};

/**
 * Format operating hours for display
 * 
 * @param {Object} dayHours - Single day's operating hours
 * @returns {string} Formatted string like "9:00 AM - 9:00 PM" or "Open 24 Hours" or "Closed"
 */
export const formatOperatingHours = (dayHours) => {
  if (!dayHours || dayHours.closed) return "Closed";
  if (dayHours.is24Hours) return "Open 24 Hours";
  
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };
  
  return `${formatTime(dayHours.start)} - ${formatTime(dayHours.end)}`;
};

/**
 * Get a summary of operating hours (for listing cards)
 * 
 * @param {Object} operatingHours - The operating hours object from listing
 * @returns {string} Summary like "Open 24 Hours" or "9AM - 9PM" or "Varies by day"
 */
export const getOperatingHoursSummary = (operatingHours) => {
  if (!operatingHours) return "Hours not set";
  
  const days = DAY_NAMES;
  const openDays = days.filter(day => !operatingHours[day]?.closed);
  
  if (openDays.length === 0) return "Temporarily closed";
  
  // Check if all open days are 24 hours
  const all24Hours = openDays.every(day => operatingHours[day]?.is24Hours);
  if (all24Hours) return "Open 24 Hours";
  
  // Check if all open days have same hours
  const firstOpenDay = openDays[0];
  const firstHours = operatingHours[firstOpenDay];
  const allSameHours = openDays.every(day => {
    const dayHours = operatingHours[day];
    return (
      dayHours?.start === firstHours?.start &&
      dayHours?.end === firstHours?.end &&
      dayHours?.is24Hours === firstHours?.is24Hours
    );
  });
  
  if (allSameHours) {
    return formatOperatingHours(firstHours);
  }
  
  return "Hours vary by day";
};