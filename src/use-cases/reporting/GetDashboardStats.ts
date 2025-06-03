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
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get today's attendance
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
      return { status: 'not_checked_in' }
    }

    let status: TodayAttendance['status'] = 'not_checked_in'
    
    if (attendance.checkInTime && attendance.checkOutTime) {
      status = 'checked_out'
    } else if (attendance.checkInTime) {
      status = 'checked_in'
    } else if (attendance.status === AttendanceStatus.ABSENT) {
      status = 'absent'
    }

    return {
      status,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      workingHours: attendance.workingHours, // Deprecated field for backward compatibility
      workingHoursMinutes: attendance.workingHoursMinutes || 0,
      isLate: attendance.isLate,
      location: attendance.latitude && attendance.longitude ? {
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        address: attendance.location
      } : undefined
    }
  }

  private buildMonthlyAttendance(attendances: any[], startDate: Date, endDate: Date): MonthlyAttendance {
    const totalWorkDays = this.calculateWorkDays(startDate, endDate)
    const presentDays = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length
    const absentDays = attendances.filter(a => a.status === AttendanceStatus.ABSENT).length
    const lateDays = attendances.filter(a => a.isLate).length
    const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0

    return {
      totalWorkDays,
      presentDays,
      absentDays,
      lateDays,
      overtimeHours,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    }
  }

  private buildAttendanceTrend(attendances: any[]): AttendanceTrend[] {
    return attendances
      .filter(attendance => attendance && attendance.attendanceDate) // Filter out invalid records
      .map(attendance => ({
        date: attendance.attendanceDate, // Use correct field name
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        workingHours: attendance.workingHoursMinutes ? Math.round(attendance.workingHoursMinutes / 60 * 100) / 100 : 0, // Convert minutes to hours for backward compatibility
        workingHoursMinutes: attendance.workingHoursMinutes || 0 // Include minutes for precise calculation
      }))
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
    const today = new Date()
    
    const teamAttendances = await Promise.all(
      teamMembers.map(member => 
        this.attendanceRepository.findByUserAndDate(member.id, today)
      )
    )

    const presentToday = teamAttendances.filter(a => a?.status === AttendanceStatus.PRESENT).length
    const absentToday = teamAttendances.filter(a => a?.status === AttendanceStatus.ABSENT).length
    const onLeaveToday = teamAttendances.filter(a => a?.status === AttendanceStatus.LEAVE).length
    const lateToday = teamAttendances.filter(a => a?.isLate).length

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
    const today = new Date()

    // Get today's company-wide attendance
    const todayAttendances = await this.attendanceRepository.findByDate(today)
    
    const presentToday = todayAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length
    const absentToday = todayAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length
    const onLeaveToday = todayAttendances.filter(a => a.status === AttendanceStatus.LEAVE).length

    // Get department stats
    const departmentStats = await Promise.all(
      departments.map(async dept => {
        const deptUsers = allUsers.filter(u => u.departmentId === dept.id)
        const deptAttendances = todayAttendances.filter(a => 
          deptUsers.some(u => u.id === a.userId)
        )
        const deptPresent = deptAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length
        
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalEmployees: deptUsers.length,
          presentToday: deptPresent,
          attendanceRate: deptUsers.length > 0 ? (deptPresent / deptUsers.length) * 100 : 0
        }
      })
    )

    // Get 7-day trend
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trendData = await this.attendanceRepository.findByDateRange(last7Days, today)
    
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(last7Days.getTime() + i * 24 * 60 * 60 * 1000)
      const dayAttendances = trendData.filter(a => 
        a.date.toDateString() === date.toDateString()
      )
      const totalPresent = dayAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length
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

  private canViewCompanyStats(userRole: string): boolean {
    return ['HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)
  }
}
