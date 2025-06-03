// ============================================================================
// PERMISSION REQUEST REPOSITORY INTERFACE
// src/domain/repositories/IPermissionRequestRepository.ts
// ============================================================================

import { PermissionType, RequestStatus } from '@prisma/client'

export interface PermissionRequestEntity {
  id: string
  userId: string
  permissionType: PermissionType
  permissionDate: Date
  startTime: Date
  endTime: Date
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

export interface CreatePermissionRequestData {
  userId: string
  permissionType: PermissionType
  permissionDate: Date
  startTime: Date
  endTime: Date
  reason: string
  description?: string
  attachmentFile?: string
  currentApproverId?: string
}

export interface UpdatePermissionRequestData {
  permissionType?: PermissionType
  permissionDate?: Date
  startTime?: Date
  endTime?: Date
  reason?: string
  description?: string
  attachmentFile?: string
  status?: RequestStatus
  currentApproverId?: string
  rejectionReason?: string
  approvedAt?: Date
  rejectedAt?: Date
}

export interface PermissionRequestFilters {
  userId?: string
  permissionType?: PermissionType
  status?: RequestStatus
  permissionDate?: Date
  startDate?: Date
  endDate?: Date
  currentApproverId?: string
  departmentId?: string
}

export interface PermissionRequestWithUser extends PermissionRequestEntity {
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

export interface IPermissionRequestRepository {
  // Basic CRUD operations
  findById(id: string): Promise<PermissionRequestEntity | null>
  findByIdWithUser(id: string): Promise<PermissionRequestWithUser | null>
  create(data: CreatePermissionRequestData): Promise<PermissionRequestEntity>
  update(id: string, data: UpdatePermissionRequestData): Promise<PermissionRequestEntity>
  delete(id: string): Promise<void>

  // User-specific queries
  findByUserId(userId: string): Promise<PermissionRequestEntity[]>
  findByUserIdWithDetails(userId: string): Promise<PermissionRequestWithUser[]>
  findByUserAndStatus(userId: string, status: RequestStatus): Promise<PermissionRequestEntity[]>
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<PermissionRequestEntity[]>
  findByUserAndDate(userId: string, date: Date): Promise<PermissionRequestEntity[]>

  // Approval workflow queries
  findByApproverId(approverId: string): Promise<PermissionRequestWithUser[]>
  findPendingByApprover(approverId: string): Promise<PermissionRequestWithUser[]>
  findByApproverAndStatus(approverId: string, status: RequestStatus): Promise<PermissionRequestWithUser[]>

  // Department queries
  findByDepartment(departmentId: string): Promise<PermissionRequestWithUser[]>
  findByDepartmentAndStatus(departmentId: string, status: RequestStatus): Promise<PermissionRequestWithUser[]>
  findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<PermissionRequestWithUser[]>
  findByDepartmentAndDate(departmentId: string, date: Date): Promise<PermissionRequestWithUser[]>

  // Status management
  approve(id: string, approverId: string, comments?: string): Promise<PermissionRequestEntity>
  reject(id: string, approverId: string, reason: string): Promise<PermissionRequestEntity>
  cancel(id: string, reason?: string): Promise<PermissionRequestEntity>

  // Advanced queries
  findMany(filters: PermissionRequestFilters, limit?: number, offset?: number): Promise<PermissionRequestWithUser[]>
  countMany(filters: PermissionRequestFilters): Promise<number>
  
  // Statistics and reporting
  countByStatus(status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByUserAndStatus(userId: string, status: RequestStatus, year?: number): Promise<number>
  countByDepartmentAndStatus(departmentId: string, status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByPermissionType(permissionType: PermissionType, startDate?: Date, endDate?: Date): Promise<number>

  // Time conflict detection
  hasTimeConflict(userId: string, permissionDate: Date, startTime: Date, endTime: Date, excludeId?: string): Promise<boolean>
  findConflictingRequests(userId: string, permissionDate: Date, startTime: Date, endTime: Date): Promise<PermissionRequestEntity[]>

  // Date and time queries
  findByDate(date: Date): Promise<PermissionRequestWithUser[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<PermissionRequestWithUser[]>
  findActivePermissionsByDate(date: Date): Promise<PermissionRequestWithUser[]>
  findUpcomingPermissions(userId: string, days: number): Promise<PermissionRequestEntity[]>

  // Duration calculations
  calculatePermissionDuration(startTime: Date, endTime: Date): number // in minutes
  getTotalPermissionHours(userId: string, startDate: Date, endDate: Date): Promise<number>
  getMonthlyPermissionHours(userId: string, year: number, month: number): Promise<number>

  // Bulk operations
  bulkUpdateStatus(ids: string[], status: RequestStatus, approverId?: string): Promise<number>
  bulkDelete(ids: string[]): Promise<number>

  // Reporting helpers
  getPermissionStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    byPermissionType: Record<PermissionType, number>
    totalHours: number
  }>

  // Workflow helpers
  getNextApprover(requestId: string): Promise<string | null>
  updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<PermissionRequestEntity>

  // Validation helpers
  isValidTimeRange(startTime: Date, endTime: Date): boolean
  isWorkingHours(time: Date): boolean
  getPermissionTypeLimit(permissionType: PermissionType): number // hours per month
  hasExceededMonthlyLimit(userId: string, permissionType: PermissionType, year: number, month: number): Promise<boolean>
}
