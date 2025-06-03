// ============================================================================
// ATTENDANCE CHECK-OUT API ROUTE
// src/app/api/attendance/check-out/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { prisma } from '@/infrastructure/prismaClient'
import { formatWorkingHours } from '@/utils/dateUtils'

// Import use cases
import { CheckOutWithLocationValidation } from '@/use-cases/attendance/CheckOutWithLocationValidation'

// Import repositories and services
import { PrismaAttendanceRepository } from '@/infrastructure/database/repositories/AttendanceRepository'
import { PrismaOfficeLocationRepository } from '@/infrastructure/database/repositories/OfficeLocationRepository'
import { LocationValidationService } from '@/infrastructure/services/LocationValidationService'
import { AttendanceAuditService } from '@/infrastructure/services/AttendanceAuditService'

// Initialize repositories and services
const attendanceRepository = new PrismaAttendanceRepository(prisma)
const officeLocationRepository = new PrismaOfficeLocationRepository(prisma)
const locationValidationService = new LocationValidationService(officeLocationRepository)
const auditService = new AttendanceAuditService(prisma)

// Initialize use case
const checkOutWithLocationValidation = new CheckOutWithLocationValidation(
  attendanceRepository,
  locationValidationService,
  auditService
)

// POST /api/attendance/check-out - Check out with optional location validation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Location validation is optional for check-out
    const result = await checkOutWithLocationValidation.execute({
      userId: session.user.id,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      toleranceMeters: 0, // Default tolerance, can be made configurable
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Format working hours for display using utility function

    return NextResponse.json({
      success: true,
      data: {
        id: result.data!.id,
        checkOutTime: result.data!.checkOutTime,
        workingHours: formatWorkingHours(result.data!.workingHoursMinutes),
        workingHoursMinutes: result.data!.workingHoursMinutes,
        isValidLocation: result.data!.isValidLocation,
        locationValidation: result.data!.locationValidation ? {
          isValid: result.data!.locationValidation.isValid,
          nearestOfficeLocation: result.data!.locationValidation.nearestOfficeLocation,
          distance: result.data!.locationValidation.distance,
          allowedRadius: result.data!.locationValidation.allowedRadius,
          message: result.data!.locationValidation.isValid 
            ? `Check-out berhasil di ${result.data!.locationValidation.nearestOfficeLocation?.name}` 
            : result.data!.locationValidation.errorMessage
        } : undefined
      }
    })
  } catch (error) {
    console.error('Error in POST /api/attendance/check-out:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
