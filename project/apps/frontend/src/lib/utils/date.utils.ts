/**
 * Shared date formatting utilities
 * Centralizes date formatting logic to ensure consistency across the application
 */

/**
 * Formats a date string or Date object to a localized date string
 * @param date - Date string or Date object
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return dateObj.toLocaleDateString(locale, defaultOptions);
}

/**
 * Formats a date to a short date string (MM/DD/YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatShortDate(date: string | Date | null | undefined): string {
  return formatDate(date, 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats a date to include time
 * @param date - Date string or Date object
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date to relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateObj);
}

/**
 * Checks if a date is in the past
 * @param date - Date string or Date object
 * @returns True if date is in the past
 */
export function isPastDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj < new Date();
}

/**
 * Checks if a date is in the future
 * @param date - Date string or Date object
 * @returns True if date is in the future
 */
export function isFutureDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj > new Date();
}

/**
 * Calculates the difference in hours between two dates
 * @param date1 - First date
 * @param date2 - Second date (default: now)
 * @returns Difference in hours
 */
export function getHoursDifference(
  date1: string | Date | null | undefined,
  date2: string | Date | null | undefined = new Date()
): number {
  if (!date1 || !date2) return 0;
  
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) return 0;
  
  return Math.abs(dateObj1.getTime() - dateObj2.getTime()) / (1000 * 60 * 60);
}

