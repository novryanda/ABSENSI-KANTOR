// ============================================================================
// APPROVAL REPOSITORY INTERFACE
// src/domain/repositories/IApprovalRepository.ts
// ============================================================================

import { RequestStatus, ApprovalStatus } from '@prisma/client'

export interface ApprovalEntity {
  id: string
  requestId: string
  requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'
  approverId: string
  level: number
  status: ApprovalStatus
  comments?: string
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateApprovalData {
  requestId: string
  requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'
  approverId: string
  level: number
  status?: ApprovalStatus
}

export interface UpdateApprovalData {
  status?: ApprovalStatus
  comments?: string
  approvedAt?: Date
  rejectedAt?: Date
}

export interface ApprovalFilters {
  requestId?: string
  requestType?: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'
  approverId?: string
  status?: ApprovalStatus
  level?: number
  startDate?: Date
  endDate?: Date
  departmentId?: string
}

export interface ApprovalWithDetails extends ApprovalEntity {
  approver: {
    id: string
    name: string
    nip?: string
    department?: {
      id: string
      name: string
    }
  }
  request?: {
    id: string
    title?: string
    submittedAt: Date
    requester: {
      id: string
      name: string
      nip?: string
      department?: {
        id: string
        name: string
      }
    }
  }
}

export interface ApprovalWorkflow {
  requestId: string
  requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'
  currentLevel: number
  totalLevels: number
  approvals: ApprovalEntity[]
  isCompleted: boolean
  finalStatus: RequestStatus
}

export interface IApprovalRepository {
  // Basic CRUD operations
  findById(id: string): Promise<ApprovalEntity | null>
  findByIdWithDetails(id: string): Promise<ApprovalWithDetails | null>
  create(data: CreateApprovalData): Promise<ApprovalEntity>
  update(id: string, data: UpdateApprovalData): Promise<ApprovalEntity>
  delete(id: string): Promise<void>

  // Request-specific queries
  findByRequestId(requestId: string): Promise<ApprovalEntity[]>
  findByRequestIdWithDetails(requestId: string): Promise<ApprovalWithDetails[]>
  findByRequestAndLevel(requestId: string, level: number): Promise<ApprovalEntity | null>

  // Approver-specific queries
  findByApproverId(approverId: string): Promise<ApprovalWithDetails[]>
  findPendingByApprover(approverId: string): Promise<ApprovalWithDetails[]>
  findByApproverAndStatus(approverId: string, status: ApprovalStatus): Promise<ApprovalWithDetails[]>
  findByApproverAndDate(approverId: string, date: Date): Promise<ApprovalWithDetails[]>
  findByApproverAndDateRange(approverId: string, startDate: Date, endDate: Date): Promise<ApprovalWithDetails[]>

  // Department queries
  findByDepartment(departmentId: string): Promise<ApprovalWithDetails[]>
  findPendingByDepartment(departmentId: string): Promise<ApprovalWithDetails[]>
  findByDepartmentAndStatus(departmentId: string, status: ApprovalStatus): Promise<ApprovalWithDetails[]>

  // Status management
  approve(id: string, comments?: string): Promise<ApprovalEntity>
  reject(id: string, reason: string): Promise<ApprovalEntity>
  delegate(id: string, newApproverId: string, reason?: string): Promise<ApprovalEntity>

  // Workflow management
  getApprovalWorkflow(requestId: string): Promise<ApprovalWorkflow>
  createApprovalWorkflow(requestId: string, requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER', approverIds: string[]): Promise<ApprovalEntity[]>
  getNextApprovalLevel(requestId: string): Promise<number>
  getCurrentApprover(requestId: string): Promise<string | null>
  getNextApprover(requestId: string): Promise<string | null>
  isWorkflowCompleted(requestId: string): Promise<boolean>
  getFinalApprovalStatus(requestId: string): Promise<RequestStatus>

  // Advanced queries
  findMany(filters: ApprovalFilters, limit?: number, offset?: number): Promise<ApprovalWithDetails[]>
  countMany(filters: ApprovalFilters): Promise<number>
  
  // Statistics and reporting
  countByStatus(status: ApprovalStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByApproverAndStatus(approverId: string, status: ApprovalStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByRequestType(requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER', startDate?: Date, endDate?: Date): Promise<number>
  countPendingByApprover(approverId: string): Promise<number>

  // Performance metrics
  getAverageApprovalTime(approverId?: string, requestType?: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'): Promise<number> // in hours
  getApprovalRate(approverId: string, startDate?: Date, endDate?: Date): Promise<number> // percentage
  getApprovalTrend(startDate: Date, endDate: Date, approverId?: string): Promise<Array<{
    date: Date
    approved: number
    rejected: number
    pending: number
  }>>

  // Bulk operations
  bulkApprove(ids: string[], approverId: string, comments?: string): Promise<number>
  bulkReject(ids: string[], approverId: string, reason: string): Promise<number>
  bulkDelegate(ids: string[], newApproverId: string, reason?: string): Promise<number>

  // Notification helpers
  getPendingApprovals(approverId: string, limit?: number): Promise<ApprovalWithDetails[]>
  getOverdueApprovals(hours: number): Promise<ApprovalWithDetails[]>
  getApprovalReminders(approverId: string): Promise<ApprovalWithDetails[]>

  // Reporting helpers
  getApprovalStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalApprovals: number
    approvedCount: number
    rejectedCount: number
    pendingCount: number
    averageApprovalTime: number
    byRequestType: Record<string, number>
    byApprover: Record<string, {
      name: string
      approved: number
      rejected: number
      pending: number
      averageTime: number
    }>
  }>

  // Escalation helpers
  findOverdueApprovals(hours: number): Promise<ApprovalWithDetails[]>
  escalateApproval(id: string, newApproverId: string, reason: string): Promise<ApprovalEntity>
  getEscalationRules(requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'): Promise<Array<{
    level: number
    hours: number
    escalateTo: string
  }>>

  // Audit helpers
  getApprovalHistory(requestId: string): Promise<ApprovalWithDetails[]>
  getApproverActivity(approverId: string, startDate: Date, endDate: Date): Promise<ApprovalWithDetails[]>
}
