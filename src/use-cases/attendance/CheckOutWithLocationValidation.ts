// ============================================================================
// CHECK OUT WITH LOCATION VALIDATION USE CASE
// src/use-cases/attendance/CheckOutWithLocationValidation.ts
// ============================================================================

import { IAttendanceRepository, UpdateAttendanceData } from '@/domain/repositories/IAttendanceRepository'
import { ILocationValidationService } from '@/domain/services/ILocationValidationService'
import { AttendanceAuditService } from '@/infrastructure/services/AttendanceAuditService'
import { getAttendanceDate } from '@/utils/dateUtils'

export interface CheckOutWithLocationValidationRequest {
  userId: string
  latitude?: number
  longitude?: number
  address?: string
  toleranceMeters?: number
  ipAddress?: string
  userAgent?: string
}

export interface CheckOutWithLocationValidationResponse {
  success: boolean
  data?: {
    id: string
    checkOutTime: Date
    workingHoursMinutes: number
    isValidLocation: boolean
    locationValidation?: {
      isValid: boolean
      nearestOfficeLocation?: {
        id: string
        name: string
        code: string
        distance: number
      }
      distance?: number
      allowedRadius?: number
      errorMessage?: string
    }
  }
  error?: string
  locationValidation?: {
    isValid: boolean
    nearestOfficeLocation?: {
      id: string
      name: string
      code: string
      distance: number
    }
    distance?: number
    allowedRadius?: number
    errorMessage?: string
  }
}

export class CheckOutWithLocationValidation {
  constructor(
    private attendanceRepository: IAttendanceRepository,
    private locationValidationService: ILocationValidationService,
    private auditService?: AttendanceAuditService
  ) {}

  async execute(request: CheckOutWithLocationValidationRequest): Promise<CheckOutWithLocationValidationResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Check if user has checked in today
      // CRITICAL: Use normalized date for consistency
      const today = getAttendanceDate()
      console.log('📅 CheckOut - Using normalized today date:', today.toISOString())
      const todayAttendance = await this.attendanceRepository.findByUserAndDate(request.userId, today)
      
      if (!todayAttendance) {
        return {
          success: false,
          error: 'Anda belum melakukan check-in hari ini'
        }
      }

      if (!todayAttendance.checkInTime) {
        return {
          success: false,
          error: 'Data check-in tidak ditemukan'
        }
      }

      // Check if already checked out
      if (todayAttendance.checkOutTime) {
        return {
          success: false,
          error: 'Anda sudah melakukan check-out hari ini'
        }
      }

      const checkOutTime = new Date()
      let locationValidation = undefined
      let isValidLocation = true

      // Validate location if coordinates are provided
      if (request.latitude !== undefined && request.longitude !== undefined) {
        // Validate against the same office location used for check-in if available
        if (todayAttendance.officeLocationId) {
          locationValidation = await this.locationValidationService.validateAgainstOfficeLocation(
            request.latitude,
            request.longitude,
            todayAttendance.officeLocationId,
            request.toleranceMeters
          )
        } else {
          // Validate against any active office location
          locationValidation = await this.locationValidationService.validateUserLocation(
            request.latitude,
            request.longitude,
            request.toleranceMeters
          )
        }

        isValidLocation = locationValidation.isValid

        // CRITICAL: Prevent check-out if location is invalid
        if (!isValidLocation) {
          console.log('❌ Location validation failed - preventing check-out submission')

          // Log failed attempt for audit purposes
          if (this.auditService) {
            try {
              await this.auditService.logFailedCheckOutAttempt(
                request.userId,
                {
                  attendanceDate: today, // Use the same normalized date
                  latitude: request.latitude,
                  longitude: request.longitude,
                  address: request.address,
                  failureReason: 'INVALID_LOCATION',
                  locationValidation
                },
                request.userId,
                request.ipAddress,
                request.userAgent
              )
              console.log('✅ Failed check-out attempt logged for audit')
            } catch (auditError) {
              console.error('⚠️ Failed to log failed check-out attempt:', auditError)
            }
          }

          // Return detailed error message in Indonesian
          const nearestLocation = locationValidation.nearestOfficeLocation
          const distance = locationValidation.distance
          const allowedRadius = locationValidation.allowedRadius

          let errorMessage = 'Anda tidak dapat melakukan absensi pulang karena berada di luar radius lokasi kantor yang terdaftar'

          if (nearestLocation && distance && allowedRadius) {
            errorMessage = `Anda tidak dapat melakukan absensi pulang karena berada di luar radius lokasi kantor yang terdaftar. Lokasi terdekat: ${nearestLocation.name} (Jarak: ${distance}m, Radius maksimal: ${allowedRadius + (request.toleranceMeters || 0)}m)`
          } else if (locationValidation.errorMessage) {
            errorMessage = locationValidation.errorMessage
          }

          return {
            success: false,
            error: errorMessage,
            locationValidation
          }
        }

        console.log('✅ Location validation passed for check-out')
      }

      // Calculate working hours
      const workingHoursMinutes = this.attendanceRepository.calculateWorkingHours(
        todayAttendance.checkInTime,
        checkOutTime
      )

      // Debug logging for working hours calculation
      console.log('⏰ Working hours calculation:', {
        checkInTime: todayAttendance.checkInTime.toISOString(),
        checkOutTime: checkOutTime.toISOString(),
        calculatedMinutes: workingHoursMinutes,
        calculatedHours: (workingHoursMinutes / 60).toFixed(2)
      })

      // Update attendance record
      const updateData: UpdateAttendanceData = {
        checkOutTime,
        checkOutLatitude: request.latitude,
        checkOutLongitude: request.longitude,
        checkOutAddress: request.address,
        workingHoursMinutes,
        isValidLocation: todayAttendance.isValidLocation && isValidLocation // Both check-in and check-out must be valid
      }

      const updatedAttendance = await this.attendanceRepository.update(todayAttendance.id, updateData)

      // Log audit trail for check-out
      if (this.auditService) {
        try {
          await this.auditService.logCheckOut(
            updatedAttendance.id,
            request.userId,
            {
              checkInTime: todayAttendance.checkInTime,
              workingHoursMinutes: todayAttendance.workingHoursMinutes
            },
            {
              checkOutTime: updatedAttendance.checkOutTime!,
              workingHoursMinutes: updatedAttendance.workingHoursMinutes,
              isValidLocation: updatedAttendance.isValidLocation,
              latitude: request.latitude,
              longitude: request.longitude,
              address: request.address
            },
            request.userId, // performedBy is the user themselves
            request.ipAddress,
            request.userAgent
          )
          console.log('✅ Check-out audit logged successfully')
        } catch (auditError) {
          console.error('⚠️ Failed to log check-out audit:', auditError)
          // Don't fail the main operation if audit logging fails
        }
      }

      return {
        success: true,
        data: {
          id: updatedAttendance.id,
          checkOutTime: updatedAttendance.checkOutTime!,
          workingHoursMinutes: updatedAttendance.workingHoursMinutes,
          isValidLocation: updatedAttendance.isValidLocation,
          locationValidation
        }
      }
    } catch (error) {
      console.error('Error during check-out with location validation:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat melakukan check-out'
      }
    }
  }

  private validateInput(request: CheckOutWithLocationValidationRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.userId || request.userId.trim().length === 0) {
      return { isValid: false, error: 'User ID wajib diisi' }
    }

    // Validate coordinates if provided
    if (request.latitude !== undefined || request.longitude !== undefined) {
      if (request.latitude === undefined || request.longitude === undefined) {
        return { isValid: false, error: 'Latitude dan longitude harus disediakan bersamaan' }
      }

      if (typeof request.latitude !== 'number' || typeof request.longitude !== 'number') {
        return { isValid: false, error: 'Koordinat harus berupa angka' }
      }

      // Validate coordinate format
      if (!this.locationValidationService.validateCoordinateFormat(request.latitude, request.longitude)) {
        return { isValid: false, error: 'Format koordinat tidak valid' }
      }
    }

    // Validate tolerance if provided
    if (request.toleranceMeters !== undefined) {
      if (typeof request.toleranceMeters !== 'number' || request.toleranceMeters < 0 || request.toleranceMeters > 500) {
        return { isValid: false, error: 'Toleransi harus antara 0-500 meter' }
      }
    }

    return { isValid: true }
  }
}
