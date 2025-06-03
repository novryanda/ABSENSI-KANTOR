// ============================================================================
// LOCATION VALIDATION SERVICE INTERFACE
// src/domain/services/ILocationValidationService.ts
// ============================================================================

export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface LocationValidationResult {
  isValid: boolean
  nearestOfficeLocation?: {
    id: string
    name: string
    code: string
    distance: number // in meters
  }
  distance?: number // distance to nearest office location in meters
  allowedRadius?: number // allowed radius in meters
  errorMessage?: string
}

export interface ILocationValidationService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param coord1 First coordinate
   * @param coord2 Second coordinate
   * @returns Distance in meters
   */
  calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number

  /**
   * Validate if user location is within allowed office locations
   * @param userLatitude User's current latitude
   * @param userLongitude User's current longitude
   * @param toleranceMeters Additional tolerance in meters (default: 0)
   * @returns Validation result with details
   */
  validateUserLocation(
    userLatitude: number, 
    userLongitude: number, 
    toleranceMeters?: number
  ): Promise<LocationValidationResult>

  /**
   * Check if coordinates are within a specific office location radius
   * @param userLatitude User's current latitude
   * @param userLongitude User's current longitude
   * @param officeLocationId Office location ID to check against
   * @param toleranceMeters Additional tolerance in meters (default: 0)
   * @returns Validation result
   */
  validateAgainstOfficeLocation(
    userLatitude: number,
    userLongitude: number,
    officeLocationId: string,
    toleranceMeters?: number
  ): Promise<LocationValidationResult>

  /**
   * Find the nearest office location to given coordinates
   * @param latitude User's latitude
   * @param longitude User's longitude
   * @returns Nearest office location with distance
   */
  findNearestOfficeLocation(
    latitude: number, 
    longitude: number
  ): Promise<{
    officeLocation: {
      id: string
      name: string
      code: string
      latitude: number
      longitude: number
      radiusMeters: number
    } | null
    distance: number | null
  }>

  /**
   * Validate coordinate format and ranges
   * @param latitude Latitude to validate
   * @param longitude Longitude to validate
   * @returns True if coordinates are valid
   */
  validateCoordinateFormat(latitude: number, longitude: number): boolean
}
