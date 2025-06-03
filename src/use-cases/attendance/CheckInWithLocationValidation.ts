// ============================================================================
// CHECK IN WITH LOCATION VALIDATION USE CASE
// src/use-cases/attendance/CheckInWithLocationValidation.ts
// ============================================================================

import { IAttendanceRepository, CreateAttendanceData } from '@/domain/repositories/IAttendanceRepository'
import { ILocationValidationService } from '@/domain/services/ILocationValidationService'
import { AttendanceAuditService } from '@/infrastructure/services/AttendanceAuditService'
import { AttendanceStatus } from '@prisma/client'
import { getAttendanceDate } from '@/utils/dateUtils'

export interface CheckInWithLocationValidationRequest {
  userId: string
  latitude: number
  longitude: number
  address?: string
  officeLocationId?: string
  toleranceMeters?: number
  ipAddress?: string
  userAgent?: string
}

export interface CheckInWithLocationValidationResponse {
  success: boolean
  data?: {
    id: string
    checkInTime: Date
    isValidLocation: boolean
    locationValidation: {
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
    status: string
  }
  error?: string
}

export class CheckInWithLocationValidation {
  constructor(
    private attendanceRepository: IAttendanceRepository,
    private locationValidationService: ILocationValidationService,
    private auditService?: AttendanceAuditService
  ) {}

  async execute(request: CheckInWithLocationValidationRequest): Promise<CheckInWithLocationValidationResponse> {
    try {
      console.log('🔍 CheckInWithLocationValidation.execute() started')
      console.log('📋 Request:', JSON.stringify(request, null, 2))

      // Validate input data
      console.log('✅ Validating input data...')
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        console.log('❌ Input validation failed:', validation.error)
        return {
          success: false,
          error: validation.error
        }
      }
      console.log('✅ Input validation passed')

      // Check if user has already checked in today
      // CRITICAL: Use normalized date for consistency
      const today = getAttendanceDate()
      console.log('📅 Checking if user has already checked in today:', today.toISOString())
      const hasCheckedIn = await this.attendanceRepository.hasCheckedIn(request.userId, today)
      console.log('🔍 Has checked in result:', hasCheckedIn)

      if (hasCheckedIn) {
        console.log('❌ User has already checked in today')
        return {
          success: false,
          error: 'Anda sudah melakukan check-in hari ini'
        }
      }
      console.log('✅ User has not checked in today, proceeding...')

      // Validate location
      console.log('🌍 Starting location validation...')
      let locationValidation
      if (request.officeLocationId) {
        console.log('🎯 Validating against specific office location:', request.officeLocationId)
        locationValidation = await this.locationValidationService.validateAgainstOfficeLocation(
          request.latitude,
          request.longitude,
          request.officeLocationId,
          request.toleranceMeters
        )
      } else {
        console.log('🔍 Validating against any active office location')
        locationValidation = await this.locationValidationService.validateUserLocation(
          request.latitude,
          request.longitude,
          request.toleranceMeters
        )
      }
      console.log('📍 Location validation result:', JSON.stringify(locationValidation, null, 2))

      // Determine attendance status based on location validation and time
      const checkInTime = new Date()
      const status = this.determineAttendanceStatus(checkInTime, locationValidation.isValid)
      console.log('📊 Determined attendance status:', status)

      // Create attendance record
      // CRITICAL: Use the same normalized date for consistency
      const attendanceData: CreateAttendanceData = {
        userId: request.userId,
        officeLocationId: locationValidation.nearestOfficeLocation?.id,
        attendanceDate: today, // Already normalized above
        checkInTime,
        checkInLatitude: request.latitude,
        checkInLongitude: request.longitude,
        checkInAddress: request.address,
        status,
        isValidLocation: locationValidation.isValid,
        workingHoursMinutes: 0
      }
      console.log('💾 Creating attendance record with data:', JSON.stringify({
        ...attendanceData,
        attendanceDate: attendanceData.attendanceDate.toISOString(),
        checkInTime: attendanceData.checkInTime?.toISOString()
      }, null, 2))

      const attendance = await this.attendanceRepository.create(attendanceData)
      console.log('✅ Attendance record created successfully:', attendance.id)

      // Log audit trail for check-in
      if (this.auditService) {
        try {
          await this.auditService.logCheckIn(
            attendance.id,
            request.userId,
            {
              attendanceDate: attendance.attendanceDate,
              checkInTime: attendance.checkInTime!,
              status: attendance.status,
              workingHoursMinutes: attendance.workingHoursMinutes,
              isValidLocation: attendance.isValidLocation,
              latitude: request.latitude,
              longitude: request.longitude,
              address: request.address,
              officeLocationId: attendance.officeLocationId || undefined
            },
            request.userId, // performedBy is the user themselves
            request.ipAddress,
            request.userAgent
          )
          console.log('✅ Check-in audit logged successfully')
        } catch (auditError) {
          console.error('⚠️ Failed to log check-in audit:', auditError)
          // Don't fail the main operation if audit logging fails
        }
      }

      return {
        success: true,
        data: {
          id: attendance.id,
          checkInTime: attendance.checkInTime!,
          isValidLocation: attendance.isValidLocation,
          locationValidation,
          status: attendance.status
        }
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR in CheckInWithLocationValidation:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return {
        success: false,
        error: 'Terjadi kesalahan saat melakukan check-in'
      }
    }
  }

  private validateInput(request: CheckInWithLocationValidationRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.userId || request.userId.trim().length === 0) {
      return { isValid: false, error: 'User ID wajib diisi' }
    }

    // Validate coordinates
    if (typeof request.latitude !== 'number' || typeof request.longitude !== 'number') {
      return { isValid: false, error: 'Koordinat harus berupa angka' }
    }

    // Validate coordinate format
    if (!this.locationValidationService.validateCoordinateFormat(request.latitude, request.longitude)) {
      return { isValid: false, error: 'Format koordinat tidak valid' }
    }

    // Validate tolerance if provided
    if (request.toleranceMeters !== undefined) {
      if (typeof request.toleranceMeters !== 'number' || request.toleranceMeters < 0 || request.toleranceMeters > 500) {
        return { isValid: false, error: 'Toleransi harus antara 0-500 meter' }
      }
    }

    return { isValid: true }
  }

  private determineAttendanceStatus(checkInTime: Date, isValidLocation: boolean): AttendanceStatus {
    // If location is invalid, mark as present but with location issue
    if (!isValidLocation) {
      return AttendanceStatus.PRESENT // Still present, but isValidLocation will be false
    }

    // Check if late (assuming work starts at 8:00 AM)
    const workStartTime = new Date(checkInTime)
    workStartTime.setHours(8, 0, 0, 0)

    if (checkInTime > workStartTime) {
      return AttendanceStatus.LATE
    }

    return AttendanceStatus.PRESENT
  }
}
