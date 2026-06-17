/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates end date by adding durationDays to startDate.
 * @param startDateStr format 'YYYY-MM-DD'
 * @param durationDays number of days
 */
export function calculateEndDate(startDateStr: string, durationDays: number): string {
  if (!startDateStr || isNaN(durationDays)) return '';
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + durationDays);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Safely formats a date string (YYYY-MM-DD) into a friendly localized human readable format.
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Computes difference in days from today's local date to the target date.
 */
export function getDaysRemaining(endDateStr: string): number {
  if (!endDateStr) return 0;
  const parts = endDateStr.split('-');
  if (parts.length !== 3) return 0;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  // Truncate times to compare date boundaries purely
  const end = new Date(year, month, day);
  end.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
