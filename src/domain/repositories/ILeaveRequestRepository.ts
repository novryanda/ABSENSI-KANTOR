// ============================================================================
// LEAVE REQUEST REPOSITORY INTERFACE
// src/domain/repositories/ILeaveRequestRepository.ts
// ============================================================================

import { LeaveType, RequestStatus } from '@prisma/client'

export interface LeaveRequestEntity {
  id: string
  userId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  totalDays: number
  reason: string
  description?: string
  attachmentFile?: string
  status: RequestStatus
  currentApproverId?: string
  rejectionReason?: string
  submittedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateLeaveRequestData {
  userId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  totalDays: number
  reason: string
  description?: string
  attachmentFile?: string
  currentApproverId?: string
}

export interface UpdateLeaveRequestData {
  leaveType?: LeaveType
  startDate?: Date
  endDate?: Date
  totalDays?: number
  reason?: string
  description?: string
  attachmentFile?: string
  status?: RequestStatus
  currentApproverId?: string
  rejectionReason?: string
  approvedAt?: Date
  rejectedAt?: Date
}

export interface LeaveRequestFilters {
  userId?: string
  leaveType?: LeaveType
  status?: RequestStatus
  startDate?: Date
  endDate?: Date
  currentApproverId?: string
  departmentId?: string
}

export interface LeaveRequestWithUser extends LeaveRequestEntity {
  user: {
    id: string
    name: string
    nip?: string
    department?: {
      id: string
      name: string
    }
  }
  currentApprover?: {
    id: string
    name: string
  }
}

export interface LeaveBalance {
  userId: string
  leaveType: LeaveType
  totalDays: number
  usedDays: number
  remainingDays: number
  year: number
}

export interface ILeaveRequestRepository {
  // Basic CRUD operations
  findById(id: string): Promise<LeaveRequestEntity | null>
  findByIdWithUser(id: string): Promise<LeaveRequestWithUser | null>
  create(data: CreateLeaveRequestData): Promise<LeaveRequestEntity>
  update(id: string, data: UpdateLeaveRequestData): Promise<LeaveRequestEntity>
  delete(id: string): Promise<void>

  // User-specific queries
  findByUserId(userId: string): Promise<LeaveRequestEntity[]>
  findByUserIdWithDetails(userId: string): Promise<LeaveRequestWithUser[]>
  findByUserAndStatus(userId: string, status: RequestStatus): Promise<LeaveRequestEntity[]>
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<LeaveRequestEntity[]>

  // Approval workflow queries
  findByApproverId(approverId: string): Promise<LeaveRequestWithUser[]>
  findPendingByApprover(approverId: string): Promise<LeaveRequestWithUser[]>
  findByApproverAndStatus(approverId: string, status: RequestStatus): Promise<LeaveRequestWithUser[]>

  // Department queries
  findByDepartment(departmentId: string): Promise<LeaveRequestWithUser[]>
  findByDepartmentAndStatus(departmentId: string, status: RequestStatus): Promise<LeaveRequestWithUser[]>
  findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<LeaveRequestWithUser[]>

  // Status management
  approve(id: string, approverId: string, comments?: string): Promise<LeaveRequestEntity>
  reject(id: string, approverId: string, reason: string): Promise<LeaveRequestEntity>
  cancel(id: string, reason?: string): Promise<LeaveRequestEntity>

  // Advanced queries
  findMany(filters: LeaveRequestFilters, limit?: number, offset?: number): Promise<LeaveRequestWithUser[]>
  countMany(filters: LeaveRequestFilters): Promise<number>
  
  // Statistics and reporting
  countByStatus(status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByUserAndStatus(userId: string, status: RequestStatus, year?: number): Promise<number>
  countByDepartmentAndStatus(departmentId: string, status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByLeaveType(leaveType: LeaveType, startDate?: Date, endDate?: Date): Promise<number>

  // Leave balance management
  calculateUsedLeaveDays(userId: string, leaveType: LeaveType, year: number): Promise<number>
  getLeaveBalance(userId: string, leaveType: LeaveType, year: number): Promise<LeaveBalance>
  getAllLeaveBalances(userId: string, year: number): Promise<LeaveBalance[]>

  // Conflict detection
  hasConflictingLeave(userId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<boolean>
  findConflictingRequests(userId: string, startDate: Date, endDate: Date): Promise<LeaveRequestEntity[]>

  // Date range queries
  findByDateRange(startDate: Date, endDate: Date): Promise<LeaveRequestWithUser[]>
  findActiveLeavesByDate(date: Date): Promise<LeaveRequestWithUser[]>
  findUpcomingLeaves(userId: string, days: number): Promise<LeaveRequestEntity[]>

  // Bulk operations
  bulkUpdateStatus(ids: string[], status: RequestStatus, approverId?: string): Promise<number>
  bulkDelete(ids: string[]): Promise<number>

  // Reporting helpers
  getLeaveStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    byLeaveType: Record<LeaveType, number>
  }>

  // Workflow helpers
  getNextApprover(requestId: string): Promise<string | null>
  updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<LeaveRequestEntity>
}
