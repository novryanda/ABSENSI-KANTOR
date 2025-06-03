// ============================================================================
// ATTENDANCE CHECK-IN API ROUTE
// src/app/api/attendance/check-in/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { prisma } from '@/infrastructure/prismaClient'

// Import use cases
import { CheckInWithLocationValidation } from '@/use-cases/attendance/CheckInWithLocationValidation'

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
const checkInWithLocationValidation = new CheckInWithLocationValidation(
  attendanceRepository,
  locationValidationService,
  auditService
)

// POST /api/attendance/check-in - Check in with location validation
export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECK-IN API START ===')
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.id)

    const body = await request.json()
    console.log('📝 Request body:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      console.log('❌ Invalid coordinates:', { latitude: body.latitude, longitude: body.longitude })
      return NextResponse.json(
        { success: false, error: 'Latitude dan longitude wajib diisi' },
        { status: 400 }
      )
    }

    console.log('✅ Coordinates valid:', { latitude: body.latitude, longitude: body.longitude })

    console.log('🚀 Executing check-in use case...')
    const result = await checkInWithLocationValidation.execute({
      userId: session.user.id,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      officeLocationId: body.officeLocationId,
      toleranceMeters: 100, // 100m radius tolerance as per requirement
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    console.log('📊 Use case result:', JSON.stringify(result, null, 2))

    if (!result.success) {
      console.log('❌ Check-in failed:', result.error)

      // Check if this is a location validation error
      if (result.locationValidation && !result.locationValidation.isValid) {
        // Return 422 (Unprocessable Entity) for location validation failures
        return NextResponse.json({
          success: false,
          error: result.error,
          locationValidation: result.locationValidation
        }, { status: 422 })
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Return success response with location validation details
    return NextResponse.json({
      success: true,
      data: {
        id: result.data!.id,
        checkInTime: result.data!.checkInTime,
        status: result.data!.status,
        isValidLocation: result.data!.isValidLocation,
        locationValidation: {
          isValid: result.data!.locationValidation.isValid,
          nearestOfficeLocation: result.data!.locationValidation.nearestOfficeLocation,
          distance: result.data!.locationValidation.distance,
          allowedRadius: result.data!.locationValidation.allowedRadius,
          message: result.data!.locationValidation.isValid 
            ? `Check-in berhasil di ${result.data!.locationValidation.nearestOfficeLocation?.name}` 
            : result.data!.locationValidation.errorMessage
        }
      }
    })
  } catch (error) {
    console.error('💥 CRITICAL ERROR in POST /api/attendance/check-in:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
