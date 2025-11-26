/**
 * Utility functions for date formatting and manipulation
 */
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Format date to Ukrainian locale string
 * @param dateString - Date as string, Date object, or undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string or 'Невідомо' if date is invalid
 */
export const formatDate = (
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
): string => {
  if (!dateString) return 'Невідомо';
  try {
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  } catch {
    return 'Невідомо';
  }
};

/**
 * Format date for short display (day and month only)
 */
export const formatDateShort = (dateString: string | Date | undefined | null): string => {
  return formatDate(dateString, { day: '2-digit', month: '2-digit' });
};

/**
 * Format date for rental display (full date)
 */
export const formatRentalDate = (dateString: string | Date | undefined | null): string => {
  return formatDate(dateString);
};

/**
 * Check if a date is within any booked period
 */
export const isDateBooked = (date: dayjs.Dayjs, bookedDates: Array<{ startDate: string; endDate: string }>): boolean => {
  return bookedDates.some((period) => {
    const start = dayjs(period.startDate);
    const end = dayjs(period.endDate);
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
  });
};

/**
 * Check if a date range is valid (doesn't overlap with booked dates)
 */
export const isDateRangeValid = (
  start: dayjs.Dayjs | null,
  end: dayjs.Dayjs | null,
  bookedDates: Array<{ startDate: string; endDate: string }>
): boolean => {
  if (!start || !end || start.isAfter(end)) return false;
  
  return !bookedDates.some((period) => {
    const bookedStart = dayjs(period.startDate);
    const bookedEnd = dayjs(period.endDate);
    // Check if ranges overlap
    return (start.isSameOrBefore(bookedEnd, 'day') && end.isSameOrAfter(bookedStart, 'day'));
  });
};

/**
 * Convert duration string (e.g., '1-2', '3-7') to number of days
 * Returns the average of the range for calculation purposes
 */
export const getDurationDays = (duration: string): number => {
  if (!duration || !duration.includes('-')) {
    return 1; // Default to 1 day if invalid format
  }
  
  const [min, max] = duration.split('-').map(Number);
  if (isNaN(min) || isNaN(max) || min < 1 || max < min) {
    return 1; // Default to 1 day if invalid values
  }
  
  // Return average of the range (rounded)
  return Math.round((min + max) / 2);
};
