// ============================================================================
// WORK LETTER REPOSITORY INTERFACE
// src/domain/repositories/IWorkLetterRepository.ts
// ============================================================================

import { WorkLetterType, RequestStatus } from '@prisma/client'

export interface WorkLetterEntity {
  id: string
  userId: string
  letterNumber?: string
  workLetterType: WorkLetterType
  purpose: string
  destination: string
  startDate: Date
  endDate: Date
  description?: string
  attachmentFile?: string
  status: RequestStatus
  currentApproverId?: string
  rejectionReason?: string
  submittedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  issuedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkLetterData {
  userId: string
  workLetterType: WorkLetterType
  purpose: string
  destination: string
  startDate: Date
  endDate: Date
  description?: string
  attachmentFile?: string
  currentApproverId?: string
}

export interface UpdateWorkLetterData {
  letterNumber?: string
  workLetterType?: WorkLetterType
  purpose?: string
  destination?: string
  startDate?: Date
  endDate?: Date
  description?: string
  attachmentFile?: string
  status?: RequestStatus
  currentApproverId?: string
  rejectionReason?: string
  approvedAt?: Date
  rejectedAt?: Date
  issuedAt?: Date
}

export interface WorkLetterFilters {
  userId?: string
  workLetterType?: WorkLetterType
  status?: RequestStatus
  startDate?: Date
  endDate?: Date
  currentApproverId?: string
  departmentId?: string
  letterNumber?: string
}

export interface WorkLetterWithUser extends WorkLetterEntity {
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

export interface IWorkLetterRepository {
  // Basic CRUD operations
  findById(id: string): Promise<WorkLetterEntity | null>
  findByIdWithUser(id: string): Promise<WorkLetterWithUser | null>
  create(data: CreateWorkLetterData): Promise<WorkLetterEntity>
  update(id: string, data: UpdateWorkLetterData): Promise<WorkLetterEntity>
  delete(id: string): Promise<void>

  // User-specific queries
  findByUserId(userId: string): Promise<WorkLetterEntity[]>
  findByUserIdWithDetails(userId: string): Promise<WorkLetterWithUser[]>
  findByUserAndStatus(userId: string, status: RequestStatus): Promise<WorkLetterEntity[]>
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkLetterEntity[]>

  // Approval workflow queries
  findByApproverId(approverId: string): Promise<WorkLetterWithUser[]>
  findPendingByApprover(approverId: string): Promise<WorkLetterWithUser[]>
  findByApproverAndStatus(approverId: string, status: RequestStatus): Promise<WorkLetterWithUser[]>

  // Department queries
  findByDepartment(departmentId: string): Promise<WorkLetterWithUser[]>
  findByDepartmentAndStatus(departmentId: string, status: RequestStatus): Promise<WorkLetterWithUser[]>
  findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<WorkLetterWithUser[]>

  // Letter number management
  findByLetterNumber(letterNumber: string): Promise<WorkLetterEntity | null>
  generateLetterNumber(workLetterType: WorkLetterType, year: number): Promise<string>
  assignLetterNumber(id: string): Promise<WorkLetterEntity>

  // Status management
  approve(id: string, approverId: string, comments?: string): Promise<WorkLetterEntity>
  reject(id: string, approverId: string, reason: string): Promise<WorkLetterEntity>
  cancel(id: string, reason?: string): Promise<WorkLetterEntity>
  issue(id: string): Promise<WorkLetterEntity>

  // Advanced queries
  findMany(filters: WorkLetterFilters, limit?: number, offset?: number): Promise<WorkLetterWithUser[]>
  countMany(filters: WorkLetterFilters): Promise<number>
  
  // Statistics and reporting
  countByStatus(status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByUserAndStatus(userId: string, status: RequestStatus, year?: number): Promise<number>
  countByDepartmentAndStatus(departmentId: string, status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByWorkLetterType(workLetterType: WorkLetterType, startDate?: Date, endDate?: Date): Promise<number>

  // Date range queries
  findByDateRange(startDate: Date, endDate: Date): Promise<WorkLetterWithUser[]>
  findActiveWorkLettersByDate(date: Date): Promise<WorkLetterWithUser[]>
  findUpcomingWorkLetters(userId: string, days: number): Promise<WorkLetterEntity[]>

  // Conflict detection
  hasConflictingWorkLetter(userId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<boolean>
  findConflictingWorkLetters(userId: string, startDate: Date, endDate: Date): Promise<WorkLetterEntity[]>

  // Duration calculations
  calculateWorkLetterDuration(startDate: Date, endDate: Date): number // in days
  getTotalWorkLetterDays(userId: string, startDate: Date, endDate: Date): Promise<number>
  getMonthlyWorkLetterDays(userId: string, year: number, month: number): Promise<number>

  // Bulk operations
  bulkUpdateStatus(ids: string[], status: RequestStatus, approverId?: string): Promise<number>
  bulkDelete(ids: string[]): Promise<number>
  bulkIssue(ids: string[]): Promise<number>

  // Reporting helpers
  getWorkLetterStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    issuedLetters: number
    byWorkLetterType: Record<WorkLetterType, number>
    totalDays: number
  }>

  // Workflow helpers
  getNextApprover(requestId: string): Promise<string | null>
  updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<WorkLetterEntity>

  // Document generation helpers
  getWorkLetterTemplate(workLetterType: WorkLetterType): Promise<string>
  generateWorkLetterDocument(id: string): Promise<Buffer>
  getWorkLetterPrintData(id: string): Promise<{
    letterNumber: string
    user: any
    workLetter: WorkLetterEntity
    approver: any
    company: any
  }>

  // Validation helpers
  isValidDateRange(startDate: Date, endDate: Date): boolean
  getWorkLetterTypeLimit(workLetterType: WorkLetterType): number // days per year
  hasExceededYearlyLimit(userId: string, workLetterType: WorkLetterType, year: number): Promise<boolean>
}
