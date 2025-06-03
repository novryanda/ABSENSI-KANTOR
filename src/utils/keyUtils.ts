// ============================================================================
// KEY GENERATION UTILITIES
// src/utils/keyUtils.ts
// ============================================================================

/**
 * Generate a safe, unique key for React components
 * Ensures keys are never undefined or duplicated
 */
export function generateSafeKey(
  prefix: string, 
  identifier: string | number | Date | null | undefined, 
  fallbackIndex?: number
): string {
  // Handle null/undefined identifiers
  if (identifier === null || identifier === undefined) {
    return `${prefix}-unknown-${fallbackIndex || Date.now()}`
  }

  // Handle Date objects
  if (identifier instanceof Date) {
    const dateStr = identifier.toISOString().split('T')[0]
    return `${prefix}-${dateStr}${fallbackIndex !== undefined ? `-${fallbackIndex}` : ''}`
  }

  // Handle strings and numbers
  const cleanId = String(identifier).replace(/[^a-zA-Z0-9-_]/g, '-')
  return `${prefix}-${cleanId}${fallbackIndex !== undefined ? `-${fallbackIndex}` : ''}`
}

/**
 * Generate unique keys for array items
 * Ensures no duplicate keys even with duplicate data
 */
export function generateArrayKeys<T>(
  items: T[],
  prefix: string,
  getIdentifier: (item: T, index: number) => string | number | Date | null | undefined
): string[] {
  const keys: string[] = []
  const keyCount = new Map<string, number>()

  items.forEach((item, index) => {
    const identifier = getIdentifier(item, index)
    let baseKey = generateSafeKey(prefix, identifier, index)

    // Handle duplicate keys
    if (keyCount.has(baseKey)) {
      const count = keyCount.get(baseKey)! + 1
      keyCount.set(baseKey, count)
      baseKey = `${baseKey}-dup-${count}`
    } else {
      keyCount.set(baseKey, 0)
    }

    keys.push(baseKey)
  })

  return keys
}

/**
 * Validate that all keys in an array are unique
 * Useful for debugging key issues
 */
export function validateUniqueKeys(keys: string[], context?: string): boolean {
  const keySet = new Set(keys)
  const isUnique = keySet.size === keys.length

  if (!isUnique && context) {
    console.error(`Duplicate keys detected in ${context}:`, {
      totalKeys: keys.length,
      uniqueKeys: keySet.size,
      duplicates: keys.filter((key, index) => keys.indexOf(key) !== index)
    })
  }

  return isUnique
}

/**
 * Generate a key for attendance records
 * Specialized function for attendance data
 */
export function generateAttendanceKey(
  attendance: { date?: Date | string; id?: string },
  index: number
): string {
  // Try to use ID first
  if (attendance.id) {
    return generateSafeKey('attendance', attendance.id, index)
  }

  // Fall back to date
  if (attendance.date) {
    return generateSafeKey('attendance', attendance.date, index)
  }

  // Last resort: use index
  return generateSafeKey('attendance', 'unknown', index)
}

/**
 * Generate a key for request records
 * Specialized function for request data
 */
export function generateRequestKey(
  request: { id?: string; createdAt?: Date | string },
  index: number
): string {
  // Try to use ID first
  if (request.id) {
    return generateSafeKey('request', request.id)
  }

  // Fall back to createdAt
  if (request.createdAt) {
    return generateSafeKey('request', request.createdAt, index)
  }

  // Last resort: use index
  return generateSafeKey('request', 'unknown', index)
}

/**
 * Debug function to log key generation info
 */
export function debugKeys(keys: string[], context: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔑 Key Debug: ${context}`)
    console.log('Generated keys:', keys)
    console.log('Unique keys:', validateUniqueKeys(keys))
    console.log('Key count:', keys.length)
    console.groupEnd()
  }
}

/**
 * Create a key generator function with a specific prefix
 * Useful for consistent key generation across components
 */
export function createKeyGenerator(prefix: string) {
  return (identifier: string | number | Date | null | undefined, fallbackIndex?: number) =>
    generateSafeKey(prefix, identifier, fallbackIndex)
}

// Pre-configured key generators for common use cases
export const attendanceKeyGen = createKeyGenerator('attendance')
export const requestKeyGen = createKeyGenerator('request')
export const userKeyGen = createKeyGenerator('user')
export const departmentKeyGen = createKeyGenerator('department')
export const notificationKeyGen = createKeyGenerator('notification')

/**
 * Ensure a key is safe for React
 * Sanitizes and validates a single key
 */
export function ensureSafeKey(key: string | null | undefined, fallback: string): string {
  if (!key || typeof key !== 'string' || key.trim() === '') {
    return fallback
  }

  // Remove potentially problematic characters
  return key.replace(/[^a-zA-Z0-9-_]/g, '-')
}

/**
 * Generate timestamp-based unique key
 * For when no other identifier is available
 */
export function generateTimestampKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default {
  generateSafeKey,
  generateArrayKeys,
  validateUniqueKeys,
  generateAttendanceKey,
  generateRequestKey,
  debugKeys,
  createKeyGenerator,
  ensureSafeKey,
  generateTimestampKey,
  // Pre-configured generators
  attendanceKeyGen,
  requestKeyGen,
  userKeyGen,
  departmentKeyGen,
  notificationKeyGen
}
