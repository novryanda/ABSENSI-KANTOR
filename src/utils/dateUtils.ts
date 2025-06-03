// ============================================================================
// DATE UTILITIES
// src/utils/dateUtils.ts
// ============================================================================

/**
 * Normalize date to start of day (00:00:00.000)
 * This ensures consistent date handling across the application
 * CRITICAL: This function must be used for all attendance date operations
 * to prevent unique constraint violations
 */
export function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/**
 * Normalize date to end of day (23:59:59.999)
 */
export function normalizeToEndOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(23, 59, 59, 999)
  return normalized
}

/**
 * Get today's date normalized to start of day
 * CRITICAL: Use this for all attendance date operations
 */
export function getTodayStartOfDay(): Date {
  return normalizeToStartOfDay(new Date())
}

/**
 * Get today's date normalized to end of day
 */
export function getTodayEndOfDay(): Date {
  return normalizeToEndOfDay(new Date())
}

/**
 * Get attendance date for database operations
 * This ensures consistent date format for the unique constraint
 */
export function getAttendanceDate(date?: Date): Date {
  return normalizeToStartOfDay(date || new Date())
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = normalizeToStartOfDay(date1)
  const d2 = normalizeToStartOfDay(date2)
  return d1.getTime() === d2.getTime()
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  return {
    start: normalizeToStartOfDay(start),
    end: normalizeToEndOfDay(end)
  }
}

/**
 * Format working hours from minutes to user-friendly format
 * @param minutes - Working hours in minutes
 * @param format - 'hours-minutes' (default) or 'minutes-only'
 * @returns Formatted string like "8h 30m" or "510 minutes"
 */
export function formatWorkingHours(minutes: number, format: 'hours-minutes' | 'minutes-only' = 'hours-minutes'): string {
  if (minutes <= 0) {
    return format === 'hours-minutes' ? '0h 0m' : '0 menit'
  }

  if (format === 'minutes-only') {
    return `${minutes} menit`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes}m`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Calculate working hours between two times in minutes
 * @param checkInTime - Check-in time
 * @param checkOutTime - Check-out time
 * @returns Working hours in minutes
 */
export function calculateWorkingMinutes(checkInTime: Date, checkOutTime: Date): number {
  const diffInMs = checkOutTime.getTime() - checkInTime.getTime()
  return Math.floor(diffInMs / (1000 * 60)) // Return in minutes
}

/**
 * Calculate working days between two dates (excluding weekends)
 */
export function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Get the start and end of current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust when day is Sunday
  
  const start = new Date(today.setDate(diff))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  return {
    start: normalizeToStartOfDay(start),
    end: normalizeToEndOfDay(end)
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

/**
 * Get relative date string (Today, Yesterday, or formatted date)
 */
export function getRelativeDateString(date: Date): string {
  if (isToday(date)) {
    return 'Hari ini'
  } else if (isYesterday(date)) {
    return 'Kemarin'
  } else {
    return formatDate(date)
  }
}
