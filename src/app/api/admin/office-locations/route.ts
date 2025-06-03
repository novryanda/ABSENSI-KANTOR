// ============================================================================
// OFFICE LOCATIONS API ROUTES
// src/app/api/admin/office-locations/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { prisma } from '@/infrastructure/prismaClient'

// Import use cases
import { CreateOfficeLocation } from '@/use-cases/office-location/CreateOfficeLocation'
import { GetOfficeLocations } from '@/use-cases/office-location/GetOfficeLocations'

// Import repositories and services
import { PrismaOfficeLocationRepository } from '@/infrastructure/database/repositories/OfficeLocationRepository'
import { LocationValidationService } from '@/infrastructure/services/LocationValidationService'
import { OfficeLocationAuditService } from '@/infrastructure/services/OfficeLocationAuditService'

// Initialize repositories and services
const officeLocationRepository = new PrismaOfficeLocationRepository(prisma)
const locationValidationService = new LocationValidationService(officeLocationRepository)
const auditService = new OfficeLocationAuditService(prisma)

// Initialize use cases
const createOfficeLocation = new CreateOfficeLocation(
  officeLocationRepository,
  locationValidationService,
  auditService
)
const getOfficeLocations = new GetOfficeLocations(officeLocationRepository)

// GET /api/admin/office-locations - Get office locations with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check Super Admin permissions
    const userRole = session.user.role?.name
    if (userRole !== 'Super Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin permissions required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || undefined
    const code = searchParams.get('code') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await getOfficeLocations.execute({
      filters: {
        name,
        code,
        isActive,
        search
      },
      pagination: {
        page,
        limit
      },
      adminUserId: session.user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in GET /api/admin/office-locations:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/office-locations - Create new office location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check Super Admin permissions
    const userRole = session.user.role?.name
    if (userRole !== 'Super Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin permissions required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await createOfficeLocation.execute({
      name: body.name,
      code: body.code,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      radiusMeters: body.radiusMeters,
      isActive: body.isActive,
      adminUserId: session.user.id,
      ipAddress,
      userAgent
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/office-locations:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
