// ============================================================================
// LOCATION VALIDATION SERVICE IMPLEMENTATION
// src/infrastructure/services/LocationValidationService.ts
// ============================================================================

import { 
  ILocationValidationService,
  LocationCoordinates,
  LocationValidationResult
} from '@/domain/services/ILocationValidationService'
import { IOfficeLocationRepository } from '@/domain/repositories/IOfficeLocationRepository'

export class LocationValidationService implements ILocationValidationService {
  constructor(private officeLocationRepository: IOfficeLocationRepository) {}

  calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180
    const φ2 = coord2.latitude * Math.PI / 180
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  async validateUserLocation(
    userLatitude: number,
    userLongitude: number,
    toleranceMeters: number = 0
  ): Promise<LocationValidationResult> {
    try {
      console.log('🌍 LocationValidationService.validateUserLocation() started')
      console.log('📍 User coordinates:', { userLatitude, userLongitude, toleranceMeters })

      // Validate coordinate format first
      if (!this.validateCoordinateFormat(userLatitude, userLongitude)) {
        console.log('❌ Invalid coordinate format')
        return {
          isValid: false,
          errorMessage: 'Format koordinat tidak valid'
        }
      }
      console.log('✅ Coordinate format valid')

      // Get all active office locations
      console.log('🏢 Fetching active office locations...')
      const activeLocations = await this.officeLocationRepository.findActive()
      console.log('📊 Found active office locations:', activeLocations.length)
      console.log('🏢 Active locations:', JSON.stringify(activeLocations, null, 2))

      if (activeLocations.length === 0) {
        console.log('❌ No active office locations found')
        return {
          isValid: false,
          errorMessage: 'Tidak ada lokasi kantor yang aktif'
        }
      }

      // Find the nearest office location and check if user is within any allowed radius
      let nearestLocation: any = null
      let shortestDistance = Infinity
      let isWithinAnyRadius = false

      for (const location of activeLocations) {
        const distance = this.calculateDistance(
          { latitude: userLatitude, longitude: userLongitude },
          { latitude: location.latitude, longitude: location.longitude }
        )

        // Check if this is the nearest location
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestLocation = {
            id: location.id,
            name: location.name,
            code: location.code,
            distance: Math.round(distance)
          }
        }

        // Check if user is within this location's radius (including tolerance)
        const allowedRadius = location.radiusMeters + toleranceMeters
        if (distance <= allowedRadius) {
          isWithinAnyRadius = true
          nearestLocation = {
            id: location.id,
            name: location.name,
            code: location.code,
            distance: Math.round(distance)
          }
          break // Found a valid location, no need to continue
        }
      }

      if (isWithinAnyRadius) {
        return {
          isValid: true,
          nearestOfficeLocation: nearestLocation,
          distance: nearestLocation.distance,
          allowedRadius: activeLocations.find(l => l.id === nearestLocation.id)?.radiusMeters
        }
      } else {
        return {
          isValid: false,
          nearestOfficeLocation: nearestLocation,
          distance: nearestLocation?.distance,
          allowedRadius: activeLocations.find(l => l.id === nearestLocation?.id)?.radiusMeters,
          errorMessage: `Anda tidak dapat melakukan absensi karena berada di luar radius lokasi kantor yang terdaftar. Lokasi terdekat: ${nearestLocation?.name} (Jarak: ${nearestLocation?.distance}m)`
        }
      }
    } catch (error) {
      console.error('Error validating user location:', error)
      return {
        isValid: false,
        errorMessage: 'Terjadi kesalahan saat memvalidasi lokasi'
      }
    }
  }

  async validateAgainstOfficeLocation(
    userLatitude: number,
    userLongitude: number,
    officeLocationId: string,
    toleranceMeters: number = 0
  ): Promise<LocationValidationResult> {
    try {
      // Validate coordinate format first
      if (!this.validateCoordinateFormat(userLatitude, userLongitude)) {
        return {
          isValid: false,
          errorMessage: 'Format koordinat tidak valid'
        }
      }

      // Get the specific office location
      const officeLocation = await this.officeLocationRepository.findById(officeLocationId)
      
      if (!officeLocation) {
        return {
          isValid: false,
          errorMessage: 'Lokasi kantor tidak ditemukan'
        }
      }

      if (!officeLocation.isActive) {
        return {
          isValid: false,
          errorMessage: 'Lokasi kantor tidak aktif'
        }
      }

      // Calculate distance
      const distance = this.calculateDistance(
        { latitude: userLatitude, longitude: userLongitude },
        { latitude: officeLocation.latitude, longitude: officeLocation.longitude }
      )

      const allowedRadius = officeLocation.radiusMeters + toleranceMeters
      const isValid = distance <= allowedRadius

      return {
        isValid,
        nearestOfficeLocation: {
          id: officeLocation.id,
          name: officeLocation.name,
          code: officeLocation.code,
          distance: Math.round(distance)
        },
        distance: Math.round(distance),
        allowedRadius: allowedRadius,
        errorMessage: isValid ? undefined :
          `Anda tidak dapat melakukan absensi karena berada di luar radius lokasi kantor yang terdaftar. Lokasi: ${officeLocation.name} (Jarak: ${Math.round(distance)}m, Radius maksimal: ${allowedRadius}m)`
      }
    } catch (error) {
      console.error('Error validating against office location:', error)
      return {
        isValid: false,
        errorMessage: 'Terjadi kesalahan saat memvalidasi lokasi'
      }
    }
  }

  async findNearestOfficeLocation(
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
  }> {
    try {
      // Validate coordinate format first
      if (!this.validateCoordinateFormat(latitude, longitude)) {
        return { officeLocation: null, distance: null }
      }

      const activeLocations = await this.officeLocationRepository.findActive()
      
      if (activeLocations.length === 0) {
        return { officeLocation: null, distance: null }
      }

      let nearestLocation = null
      let shortestDistance = Infinity

      for (const location of activeLocations) {
        const distance = this.calculateDistance(
          { latitude, longitude },
          { latitude: location.latitude, longitude: location.longitude }
        )

        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestLocation = {
            id: location.id,
            name: location.name,
            code: location.code,
            latitude: location.latitude,
            longitude: location.longitude,
            radiusMeters: location.radiusMeters
          }
        }
      }

      return {
        officeLocation: nearestLocation,
        distance: nearestLocation ? Math.round(shortestDistance) : null
      }
    } catch (error) {
      console.error('Error finding nearest office location:', error)
      return { officeLocation: null, distance: null }
    }
  }

  validateCoordinateFormat(latitude: number, longitude: number): boolean {
    // Check if coordinates are valid numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false
    }

    // Check if coordinates are within valid ranges
    if (latitude < -90 || latitude > 90) {
      return false
    }

    if (longitude < -180 || longitude > 180) {
      return false
    }

    // Check if coordinates are not NaN or Infinity
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return false
    }

    return true
  }
}
