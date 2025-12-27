// Utility functions and constants for listing page

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

export const generateTimeSlots = (start, end, minStart = null) => {
  if (!start || !end) return [];

  const slots = [];
  let [startH, startM] = start.split(":").map(Number);
  let [endH, endM] = end.split(":").map(Number);

  if (minStart) {
    const [minH, minM] = minStart.split(":").map(Number);
    if (startH < minH || (startH === minH && startM < minM)) {
      startH = minH;
      startM = minM;
    }
  }

  while (startH < endH || (startH === endH && startM < endM)) {
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

export const getOperatingHoursForDate = (date, operatingHours) => {
  if (!operatingHours) return null;
  const dayOfWeek = date.getDay();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return operatingHours[dayNames[dayOfWeek]];
};