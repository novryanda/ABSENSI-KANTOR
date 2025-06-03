// ============================================================================
// GET DASHBOARD STATS USE CASE
// src/use-cases/reporting/GetDashboardStats.ts
// ============================================================================

import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { IAttendanceRepository } from '@/domain/repositories/IAttendanceRepository'
import { ILeaveRequestRepository } from '@/domain/repositories/ILeaveRequestRepository'
import { IPermissionRequestRepository } from '@/domain/repositories/IPermissionRequestRepository'
import { IWorkLetterRepository } from '@/domain/repositories/IWorkLetterRepository'
import { IApprovalRepository } from '@/domain/repositories/IApprovalRepository'
import { IDepartmentRepository } from '@/domain/repositories/IDepartmentRepository'
import {
  DashboardStats,
  AttendanceStats,
  RequestStats,
  ApprovalStats,
  TeamStats,
  CompanyStats,
  TodayAttendance,
  MonthlyAttendance,
  AttendanceTrend
} from '@/types/domain'
import { calculateAttendanceStats, isAttendancePresent, getAttendanceDate } from '@/utils/dateUtils'
import { AttendanceStatus, RequestStatus } from '@prisma/client'

interface GetDashboardStatsRequest {
  userId: string
  userRole: string
  departmentId?: string
  includeTeamStats?: boolean
  includeCompanyStats?: boolean
  dateRange?: {
    startDate: Date
    endDate: Date
  }
}

interface GetDashboardStatsResponse {
  success: boolean
  data?: DashboardStats
  error?: string
}

export class GetDashboardStats {
  constructor(
    private userRepository: IUserRepository,
    private attendanceRepository: IAttendanceRepository,
    private leaveRequestRepository: ILeaveRequestRepository,
    private permissionRequestRepository: IPermissionRequestRepository,
    private workLetterRepository: IWorkLetterRepository,
    private approvalRepository: IApprovalRepository,
    private departmentRepository: IDepartmentRepository
  ) {}

  async execute(request: GetDashboardStatsRequest): Promise<GetDashboardStatsResponse> {
    try {
      const { userId, userRole, departmentId, includeTeamStats, includeCompanyStats } = request

      // Get user data
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Build dashboard stats based on role
      const dashboardStats: DashboardStats = {
        attendance: await this.getAttendanceStats(userId),
        requests: await this.getRequestStats(userId),
      }

      // Add approval stats for supervisors/managers
      if (this.canApprove(userRole)) {
        dashboardStats.approvals = await this.getApprovalStats(userId, departmentId)
      }

      // Add team stats for managers
      if (includeTeamStats && departmentId) {
        dashboardStats.team = await this.getTeamStats(departmentId, userId)
      }

      // Add company stats for HR/Admin
      if (includeCompanyStats && this.canViewCompanyStats(userRole)) {
        dashboardStats.company = await this.getCompanyStats()
      }

      return {
        success: true,
        data: dashboardStats
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async getAttendanceStats(userId: string): Promise<AttendanceStats> {
    // CRITICAL: Use normalized date for consistency
    const today = getAttendanceDate()
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    console.log('📊 getAttendanceStats - Using normalized today date:', {
      today: today.toISOString(),
      todayLocal: today.toLocaleDateString('id-ID'),
      currentDate: currentDate.toISOString()
    })

    // Get today's attendance using normalized date
    const todayAttendance = await this.attendanceRepository.findByUserAndDate(userId, today)
    
    // Get monthly attendance
    const monthlyAttendances = await this.attendanceRepository.findByUserAndDateRange(
      userId, 
      startOfMonth, 
      endOfMonth
    )

    // Get trend data (last 7 days)
    const trendAttendances = await this.attendanceRepository.findByUserAndDateRange(
      userId,
      last7Days,
      today
    )

    return {
      today: this.buildTodayAttendance(todayAttendance),
      monthly: this.buildMonthlyAttendance(monthlyAttendances, startOfMonth, endOfMonth),
      trend: this.buildAttendanceTrend(trendAttendances)
    }
  }

  private buildTodayAttendance(attendance: any): TodayAttendance {
    if (!attendance) {
      return { status: 'not_checked_in', workingHoursMinutes: 0 }
    }

    // Debug logging to track working hours values
    console.log('🔍 buildTodayAttendance - Raw attendance data:', {
      id: attendance.id,
      workingHoursMinutes: attendance.workingHoursMinutes,
      checkInTime: attendance.checkInTime?.toISOString(),
      checkOutTime: attendance.checkOutTime?.toISOString(),
      attendanceDate: attendance.attendanceDate?.toISOString()
    })

    let status: TodayAttendance['status'] = 'not_checked_in'

    if (attendance.checkInTime && attendance.checkOutTime) {
      status = 'checked_out'
    } else if (attendance.checkInTime) {
      status = 'checked_in'
    } else if (attendance.status === AttendanceStatus.ABSENT) {
      status = 'absent'
    }

    // Build location info if available
    let location: TodayAttendance['location'] = undefined
    if (attendance.checkInLatitude && attendance.checkInLongitude) {
      location = {
        latitude: Number(attendance.checkInLatitude),
        longitude: Number(attendance.checkInLongitude),
        address: attendance.checkInAddress
      }
    }

    // Build office location info if available
    let officeLocation: TodayAttendance['officeLocation'] = undefined
    if (attendance.officeLocation) {
      officeLocation = {
        id: attendance.officeLocation.id,
        name: attendance.officeLocation.name,
        distance: location && attendance.officeLocation.latitude && attendance.officeLocation.longitude
          ? this.calculateDistance(
              location.latitude,
              location.longitude,
              Number(attendance.officeLocation.latitude),
              Number(attendance.officeLocation.longitude)
            )
          : undefined
      }
    }

    // FIXED: Calculate real-time working hours for ongoing sessions
    const workingHoursMinutes = this.calculateDisplayWorkingHours(
      attendance.checkInTime,
      attendance.checkOutTime,
      attendance.workingHoursMinutes
    )

    console.log('⏰ Working hours calculation result:', {
      status,
      hasCheckIn: !!attendance.checkInTime,
      hasCheckOut: !!attendance.checkOutTime,
      storedMinutes: attendance.workingHoursMinutes,
      calculatedMinutes: workingHoursMinutes,
      isRealTime: !attendance.checkOutTime && !!attendance.checkInTime
    })

    return {
      status,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      workingHoursMinutes,
      isLate: attendance.isLate,
      isValidLocation: attendance.isValidLocation,
      location,
      officeLocation
    }
  }

  private buildMonthlyAttendance(attendances: any[], startDate: Date, endDate: Date): MonthlyAttendance {
    // Use the new utility function for accurate attendance calculation
    const stats = calculateAttendanceStats(attendances, startDate, endDate)

    console.log('📊 buildMonthlyAttendance - Using attendance records:', {
      recordCount: attendances.length,
      dateRange: {
        start: startDate.toLocaleDateString('id-ID'),
        end: endDate.toLocaleDateString('id-ID')
      },
      calculatedStats: stats
    })

    return stats
  }

  private buildAttendanceTrend(attendances: any[]): AttendanceTrend[] {
    console.log('🔧 buildAttendanceTrend - Processing attendances:', {
      count: attendances.length,
      sample: attendances[0] ? {
        attendanceDate: attendances[0].attendanceDate,
        attendanceDateType: typeof attendances[0].attendanceDate,
        attendanceDateISO: attendances[0].attendanceDate instanceof Date ? attendances[0].attendanceDate.toISOString() : 'Not a Date',
        status: attendances[0].status
      } : null
    })

    return attendances
      .filter(attendance => attendance && attendance.attendanceDate) // Filter out invalid records
      .map((attendance, index) => {
        // Use attendanceDate as-is from database (already normalized when saved)
        const attendanceDate = attendance.attendanceDate

        console.log(`📅 buildAttendanceTrend ${index}:`, {
          originalDate: attendance.attendanceDate,
          originalISO: attendance.attendanceDate instanceof Date ? attendance.attendanceDate.toISOString() : 'Not a Date',
          originalLocal: attendance.attendanceDate instanceof Date ? attendance.attendanceDate.toLocaleDateString('id-ID') : 'Not a Date',
          processedDate: attendanceDate,
          processedISO: attendanceDate.toISOString(),
          processedLocal: attendanceDate.toLocaleDateString('id-ID'),
          processedLocalFull: attendanceDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          status: attendance.status
        })

        return {
          date: attendanceDate, // Use processed date
          status: attendance.status,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          workingHoursMinutes: attendance.workingHoursMinutes || 0 // Working hours in minutes for precise calculation
        }
      })
  }

  private async getRequestStats(userId: string): Promise<RequestStats> {
    const [leaveRequests, permissionRequests, workLetters] = await Promise.all([
      this.leaveRequestRepository.findByUserId(userId),
      this.permissionRequestRepository.findByUserId(userId),
      this.workLetterRepository.findByUserId(userId)
    ])

    const allRequests = [
      ...leaveRequests.map(r => ({ ...r, type: 'leave' as const })),
      ...permissionRequests.map(r => ({ ...r, type: 'permission' as const })),
      ...workLetters.map(r => ({ ...r, type: 'work_letter' as const }))
    ]

    const pending = allRequests.filter(r => r.status === RequestStatus.PENDING).length
    const approved = allRequests.filter(r => r.status === RequestStatus.APPROVED).length
    const rejected = allRequests.filter(r => r.status === RequestStatus.REJECTED).length

    // Get recent requests (last 5)
    const recentRequests = allRequests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        type: r.type,
        title: r.title || `${r.type} Request`,
        status: r.status,
        createdAt: r.createdAt,
        startDate: r.startDate,
        endDate: r.endDate
      }))

    return {
      pending,
      approved,
      rejected,
      total: allRequests.length,
      recentRequests
    }
  }

  private async getApprovalStats(userId: string, departmentId?: string): Promise<ApprovalStats> {
    const pendingApprovals = await this.approvalRepository.findPendingByApprover(userId)
    
    const today = new Date()
    const todayApprovals = await this.approvalRepository.findByApproverAndDate(userId, today)

    const pendingRequests = pendingApprovals.slice(0, 10).map(approval => ({
      id: approval.id,
      type: approval.requestType as 'leave' | 'permission' | 'work_letter',
      requesterName: approval.requester?.name || 'Unknown',
      requesterDepartment: approval.requester?.department?.name || 'Unknown',
      title: approval.requestTitle || 'Request',
      submittedAt: approval.createdAt,
      urgency: this.calculateUrgency(approval.createdAt) as 'low' | 'medium' | 'high'
    }))

    return {
      pendingCount: pendingApprovals.length,
      todayApprovals: todayApprovals.length,
      pendingRequests
    }
  }

  private async getTeamStats(departmentId: string, managerId: string): Promise<TeamStats> {
    const teamMembers = await this.userRepository.findByDepartmentId(departmentId)
    // CRITICAL: Use normalized date for consistency
    const today = getAttendanceDate()
    console.log('👥 getTeamStats - Using normalized today date:', today.toISOString())

    const teamAttendances = await Promise.all(
      teamMembers.map(member =>
        this.attendanceRepository.findByUserAndDate(member.id, today)
      )
    )

    // Use consistent logic for counting attendance - PRESENT and LATE both count as present
    const presentToday = teamAttendances.filter(a => a && isAttendancePresent(a.status)).length
    const absentToday = teamAttendances.filter(a => a?.status === AttendanceStatus.ABSENT).length
    const onLeaveToday = teamAttendances.filter(a => a?.status === 'LEAVE').length // Handle LEAVE status
    const lateToday = teamAttendances.filter(a => a?.status === AttendanceStatus.LATE).length

    console.log('👥 getTeamStats - Team attendance calculation:', {
      departmentId,
      totalMembers: teamMembers.length,
      presentToday,
      absentToday,
      onLeaveToday,
      lateToday,
      attendanceRecords: teamAttendances.filter(a => a !== null).length
    })

    const teamAttendance = teamMembers.map((member, index) => {
      const attendance = teamAttendances[index]
      return {
        userId: member.id,
        name: member.name || 'Unknown',
        status: attendance?.status || AttendanceStatus.ABSENT,
        checkInTime: attendance?.checkInTime,
        location: attendance?.location
      }
    })

    return {
      totalMembers: teamMembers.length,
      presentToday,
      absentToday,
      onLeaveToday,
      lateToday,
      teamAttendance
    }
  }

  private async getCompanyStats(): Promise<CompanyStats> {
    const allUsers = await this.userRepository.findAll()
    const departments = await this.departmentRepository.findAll()
    // CRITICAL: Use normalized date for consistency
    const today = getAttendanceDate()
    console.log('🏢 getCompanyStats - Using normalized today date:', today.toISOString())

    // Get today's company-wide attendance
    const todayAttendances = await this.attendanceRepository.findByDate(today)

    // Use consistent logic for counting attendance - PRESENT and LATE both count as present
    const presentToday = todayAttendances.filter(a => isAttendancePresent(a.status)).length
    const absentToday = todayAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length
    const onLeaveToday = todayAttendances.filter(a => a.status === 'LEAVE').length

    console.log('🏢 getCompanyStats - Company attendance calculation:', {
      totalEmployees: allUsers.length,
      presentToday,
      absentToday,
      onLeaveToday,
      attendanceRecords: todayAttendances.length
    })

    // Get department stats
    const departmentStats = await Promise.all(
      departments.map(async dept => {
        const deptUsers = allUsers.filter(u => u.departmentId === dept.id)
        const deptAttendances = todayAttendances.filter(a =>
          deptUsers.some(u => u.id === a.userId)
        )
        // Use consistent logic for department stats too
        const deptPresent = deptAttendances.filter(a => isAttendancePresent(a.status)).length

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalEmployees: deptUsers.length,
          presentToday: deptPresent,
          attendanceRate: deptUsers.length > 0 ? (deptPresent / deptUsers.length) * 100 : 0
        }
      })
    )

    // Get 7-day trend - FIXED: Use attendanceDate instead of date
    const currentDate = new Date()
    const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trendData = await this.attendanceRepository.findByDateRange(last7Days, today)

    console.log('📈 getCompanyStats - Trend calculation:', {
      last7Days: last7Days.toISOString(),
      today: today.toISOString(),
      trendRecords: trendData.length
    })

    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(last7Days.getTime() + i * 24 * 60 * 60 * 1000)
      const dayAttendances = trendData.filter(a =>
        a.attendanceDate.toDateString() === date.toDateString() // FIXED: Use attendanceDate
      )
      // Use consistent logic for trend calculation
      const totalPresent = dayAttendances.filter(a => isAttendancePresent(a.status)).length
      const totalAbsent = dayAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length
      const total = totalPresent + totalAbsent

      return {
        date,
        totalPresent,
        totalAbsent,
        attendanceRate: total > 0 ? (totalPresent / total) * 100 : 0
      }
    })

    return {
      totalEmployees: allUsers.length,
      presentToday,
      absentToday,
      onLeaveToday,
      departmentStats,
      attendanceTrend
    }
  }

  private calculateWorkDays(startDate: Date, endDate: Date): number {
    let count = 0
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  private calculateUrgency(submittedAt: Date): string {
    const now = new Date()
    const hoursDiff = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 48) return 'high'
    if (hoursDiff > 24) return 'medium'
    return 'low'
  }

  private canApprove(userRole: string): boolean {
    return ['SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)
  }

  /**
   * Calculate display working hours with real-time calculation for ongoing sessions
   * @param checkInTime - Check-in time (Date object or ISO string)
   * @param checkOutTime - Check-out time (Date object or ISO string, optional)
   * @param storedWorkingMinutes - Stored working minutes from database
   * @returns Working hours in minutes (real-time if still working, stored if completed)
   */
  private calculateDisplayWorkingHours(
    checkInTime?: Date | string,
    checkOutTime?: Date | string,
    storedWorkingMinutes?: number
  ): number {
    try {
      // Convert to Date objects safely
      const checkInDate = this.safeToDate(checkInTime)
      const checkOutDate = this.safeToDate(checkOutTime)

      // If user has checked out, use stored working minutes
      if (checkOutDate && storedWorkingMinutes !== undefined) {
        return storedWorkingMinutes
      }

      // If user is still checked in, calculate current working time
      if (checkInDate && !checkOutDate) {
        const now = new Date()
        const diffInMs = now.getTime() - checkInDate.getTime()
        return Math.max(0, Math.floor(diffInMs / (1000 * 60))) // Ensure non-negative
      }

      // Fallback to stored value or 0
      return storedWorkingMinutes || 0
    } catch (error) {
      console.error('❌ Error in calculateDisplayWorkingHours:', error, {
        checkInTime,
        checkOutTime,
        storedWorkingMinutes
      })
      return storedWorkingMinutes || 0
    }
  }

  /**
   * Safely convert a date input to a Date object
   * @param dateInput - Date object, string, or null/undefined
   * @returns Date object or null if conversion fails
   */
  private safeToDate(dateInput: Date | string | null | undefined): Date | null {
    if (!dateInput) {
      return null
    }

    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput
    }

    if (typeof dateInput === 'string') {
      try {
        const date = new Date(dateInput)
        return isNaN(date.getTime()) ? null : date
      } catch (error) {
        console.warn('Failed to parse date string in GetDashboardStats:', dateInput, error)
        return null
      }
    }

    return null
  }

  private canViewCompanyStats(userRole: string): boolean {
    return ['HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }
}
