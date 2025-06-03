// ============================================================================
// DOMAIN TYPES
// src/types/domain.ts
// ============================================================================

import { UserStatus, Gender, AttendanceStatus, RequestStatus, ApprovalStatus } from '@prisma/client'

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  attendance: AttendanceStats
  requests: RequestStats
  approvals?: ApprovalStats
  team?: TeamStats
  company?: CompanyStats
}

export interface AttendanceStats {
  today: TodayAttendance
  monthly: MonthlyAttendance
  trend: AttendanceTrend[]
}

export interface TodayAttendance {
  status: 'not_checked_in' | 'checked_in' | 'checked_out' | 'absent'
  checkInTime?: Date
  checkOutTime?: Date
  workingHoursMinutes: number // Working hours in minutes for precise calculation
  isLate?: boolean
  isValidLocation?: boolean // Whether the check-in location was valid
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  officeLocation?: {
    id: string
    name: string
    distance?: number // Distance from office in meters
  }
}

export interface MonthlyAttendance {
  totalWorkDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  overtimeHours: number
  attendanceRate: number
}

export interface AttendanceTrend {
  date: Date
  status: AttendanceStatus
  checkInTime?: Date
  checkOutTime?: Date
  workingHoursMinutes: number // Working hours in minutes for precise calculation
}

export interface RequestStats {
  pending: number
  approved: number
  rejected: number
  total: number
  recentRequests: RecentRequest[]
}

export interface RecentRequest {
  id: string
  type: 'leave' | 'permission' | 'work_letter'
  title: string
  status: RequestStatus
  createdAt: Date
  startDate?: Date
  endDate?: Date
}

export interface ApprovalStats {
  pendingCount: number
  todayApprovals: number
  pendingRequests: PendingApproval[]
}

export interface PendingApproval {
  id: string
  type: 'leave' | 'permission' | 'work_letter'
  requesterName: string
  requesterDepartment: string
  title: string
  submittedAt: Date
  urgency: 'low' | 'medium' | 'high'
}

export interface TeamStats {
  totalMembers: number
  presentToday: number
  absentToday: number
  onLeaveToday: number
  lateToday: number
  teamAttendance: TeamMemberAttendance[]
}

export interface TeamMemberAttendance {
  userId: string
  name: string
  status: AttendanceStatus
  checkInTime?: Date
  location?: string
}

export interface CompanyStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  onLeaveToday: number
  departmentStats: DepartmentStats[]
  attendanceTrend: CompanyAttendanceTrend[]
}

export interface DepartmentStats {
  departmentId: string
  departmentName: string
  totalEmployees: number
  presentToday: number
  attendanceRate: number
}

export interface CompanyAttendanceTrend {
  date: Date
  totalPresent: number
  totalAbsent: number
  attendanceRate: number
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface DashboardNotification {
  id: string
  type: 'approval' | 'request_update' | 'system' | 'reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  metadata?: Record<string, any>
}

// ============================================================================
// QUICK ACTION TYPES
// ============================================================================

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href?: string
  action?: () => void
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  badge?: number
}

// ============================================================================
// ACTIVITY FEED TYPES
// ============================================================================

export interface ActivityItem {
  id: string
  type: 'attendance' | 'request' | 'approval' | 'system'
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

// ============================================================================
// ROLE-BASED DASHBOARD CONFIG
// ============================================================================

export interface DashboardConfig {
  role: string
  sections: DashboardSection[]
  quickActions: QuickAction[]
  refreshInterval?: number
}

export interface DashboardSection {
  id: string
  title: string
  component: string
  order: number
  span?: number // Grid span
  permissions?: string[]
  visible: boolean
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

export interface AttendanceChartData extends ChartData {
  type: 'line' | 'bar' | 'doughnut'
  period: 'daily' | 'weekly' | 'monthly'
}
