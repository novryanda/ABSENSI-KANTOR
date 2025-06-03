 // ============================================================================
// DATE UTILITIES
// src/utils/dateUtils.ts
// ============================================================================

/**
 * Normalize date to start of day (00:00:00.000) in UTC timezone
 * This ensures consistent date handling across the application
 * CRITICAL: This function must be used for all attendance date operations
 * to prevent unique constraint violations and timezone-related date shifts
 */
export function normalizeToStartOfDay(date: Date): Date {
  // FIXED: Use UTC date components to prevent timezone-related date shifts
  // Extract UTC date components to maintain the same calendar date
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  // Create normalized date in UTC timezone (this prevents date shifts)
  const normalized = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

  // Debug logging to track date normalization
  console.log('📅 normalizeToStartOfDay (FIXED):', {
    input: date.toISOString(),
    inputLocal: date.toLocaleDateString('id-ID'),
    inputUTC: date.toISOString().split('T')[0],
    normalized: normalized.toISOString(),
    normalizedLocal: normalized.toLocaleDateString('id-ID'),
    normalizedUTC: normalized.toISOString().split('T')[0],
    timezoneOffset: date.getTimezoneOffset(),
    inputComponents: { year, month, day },
    normalizedComponents: {
      year: normalized.getUTCFullYear(),
      month: normalized.getUTCMonth(),
      day: normalized.getUTCDate()
    }
  })

  return normalized
}

/**
 * Normalize date to end of day (23:59:59.999) in UTC timezone
 * FIXED: Now consistent with normalizeToStartOfDay UTC approach
 */
export function normalizeToEndOfDay(date: Date): Date {
  // Use UTC date components to maintain consistency
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  // Create end of day in UTC timezone
  const normalized = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
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
 * FIXED: Now properly handles UTC dates to prevent timezone-related date shifts
 */
export function getAttendanceDate(date?: Date): Date {
  const inputDate = date || new Date()
  const normalizedDate = normalizeToStartOfDay(inputDate)

  // Enhanced debug logging to track date handling and verify fix
  console.log('🗓️ getAttendanceDate (FIXED):', {
    input: inputDate.toISOString(),
    inputLocal: inputDate.toLocaleDateString('id-ID'),
    inputUTC: inputDate.toISOString().split('T')[0],
    normalized: normalizedDate.toISOString(),
    normalizedLocal: normalizedDate.toLocaleDateString('id-ID'),
    normalizedUTC: normalizedDate.toISOString().split('T')[0],
    expectedForJune3: '2025-06-03T00:00:00.000Z',
    isCorrectDate: normalizedDate.toISOString().startsWith('2025-06-03'),
    localString: normalizedDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })

  return normalizedDate
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
 * Safely convert a date input to a Date object
 * @param dateInput - Date object, string, or null/undefined
 * @returns Date object or null if conversion fails
 */
function safeToDate(dateInput: Date | string | null | undefined): Date | null {
  if (!dateInput) {
    return null
  }

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput
  }

  if (typeof dateInput === 'string') {
    try {
      const date = new Date(dateInput)
      return isNaN(date.getTime()) ? null : date
    } catch (error) {
      console.warn('Failed to parse date string:', dateInput, error)
      return null
    }
  }

  return null
}

/**
 * Calculate current working hours for an ongoing work session
 * @param checkInTime - Check-in time (Date object or ISO string)
 * @param currentTime - Current time (defaults to now)
 * @returns Working hours in minutes since check-in
 */
export function calculateCurrentWorkingMinutes(checkInTime: Date | string, currentTime?: Date): number {
  const checkInDate = safeToDate(checkInTime)
  if (!checkInDate) {
    console.warn('calculateCurrentWorkingMinutes: Invalid checkInTime provided:', checkInTime)
    return 0
  }

  const now = currentTime || new Date()
  const diffInMs = now.getTime() - checkInDate.getTime()
  return Math.max(0, Math.floor(diffInMs / (1000 * 60))) // Ensure non-negative
}

/**
 * Get the appropriate working hours for display
 * @param checkInTime - Check-in time (Date object, ISO string, or null/undefined)
 * @param checkOutTime - Check-out time (Date object, ISO string, or null/undefined)
 * @param storedWorkingMinutes - Stored working minutes from database
 * @returns Working hours in minutes (real-time if still working, stored if completed)
 */
export function getDisplayWorkingMinutes(
  checkInTime?: Date | string | null,
  checkOutTime?: Date | string | null,
  storedWorkingMinutes?: number
): number {
  try {
    // Convert inputs to Date objects safely
    const checkInDate = safeToDate(checkInTime)
    const checkOutDate = safeToDate(checkOutTime)

    // Debug logging for troubleshooting
    console.log('🔍 getDisplayWorkingMinutes called with:', {
      checkInTime: checkInTime,
      checkInTimeType: typeof checkInTime,
      checkOutTime: checkOutTime,
      checkOutTimeType: typeof checkOutTime,
      storedWorkingMinutes,
      checkInDate: checkInDate?.toISOString(),
      checkOutDate: checkOutDate?.toISOString()
    })

    // If user has checked out, use stored working minutes
    if (checkOutDate && storedWorkingMinutes !== undefined) {
      console.log('✅ Using stored working minutes (user checked out):', storedWorkingMinutes)
      return storedWorkingMinutes
    }

    // If user is still checked in, calculate current working time
    if (checkInDate && !checkOutDate) {
      const currentMinutes = calculateCurrentWorkingMinutes(checkInDate)
      console.log('⏱️ Calculating real-time working minutes:', currentMinutes)
      return currentMinutes
    }

    // Fallback to stored value or 0
    const fallbackValue = storedWorkingMinutes || 0
    console.log('🔄 Using fallback working minutes:', fallbackValue)
    return fallbackValue
  } catch (error) {
    console.error('❌ Error in getDisplayWorkingMinutes:', error, {
      checkInTime,
      checkOutTime,
      storedWorkingMinutes
    })
    return storedWorkingMinutes || 0
  }
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

/**
 * Format relative time with better accuracy for attendance activities
 * @param date - The date to format relative to now (Date object or ISO string)
 * @returns Formatted relative time string in Indonesian
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const targetDate = safeToDate(date)
    if (!targetDate) {
      console.warn('formatRelativeTime: Invalid date provided:', date)
      return 'Waktu tidak valid'
    }

    const now = new Date()
    const diffInMs = now.getTime() - targetDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // Handle future dates (shouldn't happen but good to be safe)
    if (diffInMs < 0) {
      return 'Baru saja'
    }

    // Less than 1 minute
    if (diffInMinutes < 1) {
      return 'Baru saja'
    }

    // Less than 1 hour
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`
    }

    // Less than 24 hours
    if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`
    }

    // 1 day
    if (diffInDays === 1) {
      return 'Kemarin'
    }

    // More than 1 day
    if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`
    }

    // More than a week, show actual date
    return formatDate(targetDate)
  } catch (error) {
    console.error('❌ Error in formatRelativeTime:', error, { date })
    return 'Waktu tidak valid'
  }
}

/**
 * Check if attendance status should be counted as "present" for statistics
 * PRESENT and LATE are both considered as "attended" days
 */
export function isAttendancePresent(status: string): boolean {
  return status === 'PRESENT' || status === 'LATE'
}

/**
 * Parse attendance date from API response with timezone awareness
 * This prevents date shifts when converting from ISO string to local date
 * FIXED: Now properly handles UTC dates consistently with the normalization fix
 */
export function parseAttendanceDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput
  }

  // Parse ISO string and create date in UTC timezone (consistent with normalization)
  const isoDate = new Date(dateInput)

  // Extract UTC date components to maintain consistency
  const year = isoDate.getUTCFullYear()
  const month = isoDate.getUTCMonth()
  const day = isoDate.getUTCDate()

  // Create date in UTC timezone with same date components (consistent with normalizeToStartOfDay)
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

  console.log('🕐 parseAttendanceDate (FIXED):', {
    input: dateInput,
    inputType: typeof dateInput,
    isoDate: isoDate.toISOString(),
    extractedComponents: { year, month, day },
    utcDate: utcDate.toISOString(),
    utcDateLocal: utcDate.toLocaleDateString('id-ID'),
    utcDateFull: utcDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })

  return utcDate
}

/**
 * Calculate attendance statistics from attendance records
 * Uses actual attendance dates from database records, not current system date
 */
export function calculateAttendanceStats(attendances: any[], startDate: Date, endDate: Date) {
  const totalWorkDays = calculateWorkDays(startDate, endDate)

  // Count days based on actual attendance records using attendanceDate field
  const presentDays = attendances.filter(a => isAttendancePresent(a.status)).length
  const absentDays = attendances.filter(a => a.status === 'ABSENT').length
  const lateDays = attendances.filter(a => a.status === 'LATE').length
  const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)

  // Calculate attendance rate based on actual present days vs total work days
  const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0

  console.log('📊 calculateAttendanceStats:', {
    totalWorkDays,
    presentDays,
    absentDays,
    lateDays,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    attendanceRecords: attendances.length,
    dateRange: {
      start: startDate.toLocaleDateString('id-ID'),
      end: endDate.toLocaleDateString('id-ID')
    }
  })

  return {
    totalWorkDays,
    presentDays,
    absentDays,
    lateDays,
    overtimeHours,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  }
}
