// ============================================================================
// DASHBOARD API ROUTE
// src/app/api/dashboard/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { GetDashboardStats } from '@/use-cases/reporting/GetDashboardStats'
import { PrismaUserRepository } from '@/infrastructure/database/repositories/UserRepository'
import { PrismaAttendanceRepository } from '@/infrastructure/database/repositories/AttendanceRepository'
import { PrismaLeaveRequestRepository } from '@/infrastructure/database/repositories/LeaveRequestRepository'
import { PrismaPermissionRequestRepository } from '@/infrastructure/database/repositories/PermissionRequestRepository'
import { PrismaWorkLetterRepository } from '@/infrastructure/database/repositories/WorkLetterRepository'
import { PrismaApprovalRepository } from '@/infrastructure/database/repositories/ApprovalRepository'
import { PrismaDepartmentRepository } from '@/infrastructure/database/repositories/DepartmentRepository'
import { prisma } from '@/infrastructure/prismaClient'

// Initialize repositories
const userRepository = new PrismaUserRepository(prisma)
const attendanceRepository = new PrismaAttendanceRepository(prisma)
const leaveRequestRepository = new PrismaLeaveRequestRepository(prisma)
const permissionRequestRepository = new PrismaPermissionRequestRepository(prisma)
const workLetterRepository = new PrismaWorkLetterRepository(prisma)
const approvalRepository = new PrismaApprovalRepository(prisma)
const departmentRepository = new PrismaDepartmentRepository(prisma)

// Initialize use case
const getDashboardStats = new GetDashboardStats(
  userRepository,
  attendanceRepository,
  leaveRequestRepository,
  permissionRequestRepository,
  workLetterRepository,
  approvalRepository,
  departmentRepository
)

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeTeamStats = searchParams.get('includeTeam') === 'true'
    const includeCompanyStats = searchParams.get('includeCompany') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get user details
    const user = await userRepository.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare request
    const dashboardRequest = {
      userId: session.user.id,
      userRole: user.role?.name || 'EMPLOYEE',
      departmentId: user.departmentId || undefined,
      includeTeamStats,
      includeCompanyStats,
      dateRange: startDate && endDate ? {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      } : undefined
    }

    // Execute use case
    const result = await getDashboardStats.execute(dashboardRequest)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // CRITICAL: Ensure proper date serialization to prevent timezone issues
    const serializedData = JSON.parse(JSON.stringify(result.data, (key, value) => {
      // Handle Date objects to prevent timezone conversion issues
      if (value instanceof Date) {
        // For attendance dates, use ISO string to preserve exact date
        if (key === 'attendanceDate' || key === 'date') {
          console.log(`📅 Serializing ${key}:`, {
            original: value,
            iso: value.toISOString(),
            local: value.toLocaleDateString('id-ID')
          })
          return value.toISOString()
        }
        return value.toISOString()
      }
      return value
    }))

    console.log('📤 Dashboard API response data sample:', {
      attendanceTrend: serializedData.attendance?.trend?.slice(0, 1) || 'No trend data'
    })

    return NextResponse.json({
      success: true,
      data: serializedData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      includeTeamStats = false, 
      includeCompanyStats = false,
      dateRange 
    } = body

    // Get user details
    const user = await userRepository.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare request
    const dashboardRequest = {
      userId: session.user.id,
      userRole: user.role?.name || 'EMPLOYEE',
      departmentId: user.departmentId || undefined,
      includeTeamStats,
      includeCompanyStats,
      dateRange: dateRange ? {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      } : undefined
    }

    // Execute use case
    const result = await getDashboardStats.execute(dashboardRequest)

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
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
