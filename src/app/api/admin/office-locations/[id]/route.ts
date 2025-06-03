// ============================================================================
// INDIVIDUAL OFFICE LOCATION API ROUTES
// src/app/api/admin/office-locations/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { prisma } from '@/infrastructure/prismaClient'

// Import use cases
import { GetOfficeLocationById } from '@/use-cases/office-location/GetOfficeLocationById'
import { UpdateOfficeLocation } from '@/use-cases/office-location/UpdateOfficeLocation'
import { DeleteOfficeLocation } from '@/use-cases/office-location/DeleteOfficeLocation'

// Import repositories and services
import { PrismaOfficeLocationRepository } from '@/infrastructure/database/repositories/OfficeLocationRepository'
import { LocationValidationService } from '@/infrastructure/services/LocationValidationService'
import { OfficeLocationAuditService } from '@/infrastructure/services/OfficeLocationAuditService'

// Initialize repositories and services
const officeLocationRepository = new PrismaOfficeLocationRepository(prisma)
const locationValidationService = new LocationValidationService(officeLocationRepository)
const auditService = new OfficeLocationAuditService(prisma)

// Initialize use cases
const getOfficeLocationById = new GetOfficeLocationById(officeLocationRepository)
const updateOfficeLocation = new UpdateOfficeLocation(
  officeLocationRepository,
  locationValidationService,
  auditService
)
const deleteOfficeLocation = new DeleteOfficeLocation(
  officeLocationRepository,
  auditService
)

// GET /api/admin/office-locations/[id] - Get office location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await getOfficeLocationById.execute({
      id: params.id,
      adminUserId: session.user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Lokasi kantor tidak ditemukan' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in GET /api/admin/office-locations/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/office-locations/[id] - Update office location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await updateOfficeLocation.execute({
      id: params.id,
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
        { status: result.error === 'Lokasi kantor tidak ditemukan' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/office-locations/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/office-locations/[id] - Delete office location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await deleteOfficeLocation.execute({
      id: params.id,
      adminUserId: session.user.id,
      ipAddress,
      userAgent
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Lokasi kantor tidak ditemukan' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/office-locations/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
