/**
 * Date utility functions for consistent date handling across the application
 * Prevents timezone-related issues when working with dates
 */

/**
 * Parse a YYYY-MM-DD string as LOCAL midnight (not UTC)
 * This prevents timezone shifting issues
 * @param {string} dateStr - Date string in format "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
 * @returns {Date} - Date object set to local midnight
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) {
    throw new Error("Date string is required");
  }

  // Handle both "2025-01-15" and "2025-01-15T00:00:00.000Z" formats
  const cleanDateStr = dateStr.split("T")[0];
  const [year, month, day] = cleanDateStr.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }

  // Validate ranges
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}`);
  }

  // Month is 0-indexed in JavaScript Date
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get end of day for a given date
 * @param {Date} date - Date object
 * @returns {Date} - Date object set to 23:59:59.999
 */
export function getEndOfDay(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Get start of day for a given date
 * @param {Date} date - Date object
 * @returns {Date} - Date object set to 00:00:00.000
 */
export function getStartOfDay(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Validate date format matches YYYY-MM-DD
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid format
 */
export function isValidDateFormat(dateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateStr);
}

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is before today
 */
export function isDateInPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// Add to your dateUtils.js
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}