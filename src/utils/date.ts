/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the end date by adding a duration in days to the start date.
 * If the start date is invalid or duration is invalid, returns an empty string or standard format.
 */
export function calculateEndDate(startDateStr: string, durationDays: number): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  
  // Add duration in days
  date.setDate(date.getDate() + durationDays);
  
  // Return in YYYY-MM-DD format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get a nicely formatted date for display
 */
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
