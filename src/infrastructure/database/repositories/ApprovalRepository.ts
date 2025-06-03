// ============================================================================
// APPROVAL REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/ApprovalRepository.ts
// ============================================================================

import { PrismaClient, RequestStatus, ApprovalStatus } from '@prisma/client'
import {
  IApprovalRepository,
  ApprovalEntity,
  CreateApprovalData,
  UpdateApprovalData,
  ApprovalFilters,
  ApprovalWithDetails,
  ApprovalWorkflow
} from '@/domain/repositories/IApprovalRepository'

export class PrismaApprovalRepository implements IApprovalRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<ApprovalEntity | null> {
    const approval = await this.prisma.approval.findUnique({
      where: { id }
    })
    return approval
  }

  async findByIdWithDetails(id: string): Promise<ApprovalWithDetails | null> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    return approval as ApprovalWithDetails | null
  }

  async create(data: CreateApprovalData): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.create({
      data: {
        ...data,
        status: data.status || ApprovalStatus.PENDING
      }
    })
    return approval
  }

  async update(id: string, data: UpdateApprovalData): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.update({
      where: { id },
      data
    })
    return approval
  }

  async delete(id: string): Promise<void> {
    await this.prisma.approval.delete({
      where: { id }
    })
  }

  async findByRequestId(requestId: string): Promise<ApprovalEntity[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { requestId },
      orderBy: { level: 'asc' }
    })
    return approvals
  }

  async findByRequestIdWithDetails(requestId: string): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { requestId },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { level: 'asc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async findByApproverId(approverId: string): Promise<ApprovalEntity[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { 
        approverId,
        status: ApprovalStatus.PENDING
      },
      orderBy: { createdAt: 'asc' }
    })
    return approvals
  }

  async findByApproverIdWithDetails(approverId: string): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { 
        approverId,
        status: ApprovalStatus.PENDING
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async findByStatus(status: ApprovalStatus): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { status },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async findByRequestType(requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { requestType },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async approve(id: string, approverId: string, comments?: string): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
        comments
      }
    })
    return approval
  }

  async reject(id: string, approverId: string, reason: string): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        rejectedAt: new Date(),
        comments: reason
      }
    })
    return approval
  }

  async delegate(id: string, newApproverId: string, reason?: string): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.update({
      where: { id },
      data: {
        approverId: newApproverId,
        comments: reason
      }
    })
    return approval
  }

  async countByStatus(status: ApprovalStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { status }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      }
    }

    return await this.prisma.approval.count({ where })
  }

  async countByApproverId(approverId: string, status?: ApprovalStatus): Promise<number> {
    const where: any = { approverId }

    if (status) {
      where.status = status
    }

    return await this.prisma.approval.count({ where })
  }

  async countByRequestType(requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER', status?: ApprovalStatus): Promise<number> {
    const where: any = { requestType }

    if (status) {
      where.status = status
    }

    return await this.prisma.approval.count({ where })
  }

  async getApprovalWorkflow(requestId: string): Promise<ApprovalWorkflow> {
    const approvals = await this.findByRequestIdWithDetails(requestId)
    
    return {
      requestId,
      currentLevel: approvals.find(a => a.status === ApprovalStatus.PENDING)?.level || 0,
      totalLevels: Math.max(...approvals.map(a => a.level)),
      approvals,
      isCompleted: approvals.every(a => a.status !== ApprovalStatus.PENDING),
      finalStatus: this.determineFinalStatus(approvals)
    }
  }

  private determineFinalStatus(approvals: ApprovalEntity[]): RequestStatus {
    if (approvals.some(a => a.status === ApprovalStatus.REJECTED)) {
      return RequestStatus.REJECTED
    }
    if (approvals.every(a => a.status === ApprovalStatus.APPROVED)) {
      return RequestStatus.APPROVED
    }
    return RequestStatus.PENDING
  }

  async createApprovalWorkflow(requestId: string, requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER', approverIds: string[]): Promise<ApprovalEntity[]> {
    const approvals = await Promise.all(
      approverIds.map((approverId, index) =>
        this.create({
          requestId,
          requestType,
          approverId,
          level: index + 1
        })
      )
    )
    return approvals
  }

  async getNextApprovalLevel(requestId: string): Promise<number> {
    const approvals = await this.findByRequestId(requestId)
    const pendingApproval = approvals.find(a => a.status === ApprovalStatus.PENDING)
    return pendingApproval?.level || 0
  }

  async getCurrentApprover(requestId: string): Promise<string | null> {
    const approvals = await this.findByRequestId(requestId)
    const pendingApproval = approvals.find(a => a.status === ApprovalStatus.PENDING)
    return pendingApproval?.approverId || null
  }

  async getNextApprover(requestId: string): Promise<string | null> {
    const approvals = await this.findByRequestId(requestId)
    const currentLevel = await this.getNextApprovalLevel(requestId)
    const nextApproval = approvals.find(a => a.level === currentLevel + 1)
    return nextApproval?.approverId || null
  }

  async isWorkflowCompleted(requestId: string): Promise<boolean> {
    const approvals = await this.findByRequestId(requestId)
    return approvals.every(a => a.status !== ApprovalStatus.PENDING)
  }

  async getFinalApprovalStatus(requestId: string): Promise<RequestStatus> {
    const approvals = await this.findByRequestId(requestId)
    return this.determineFinalStatus(approvals)
  }

  async findMany(filters: ApprovalFilters, limit?: number, offset?: number): Promise<ApprovalWithDetails[]> {
    const where: any = {}

    if (filters.requestId) where.requestId = filters.requestId
    if (filters.approverId) where.approverId = filters.approverId
    if (filters.status) where.status = filters.status
    if (filters.requestType) where.requestType = filters.requestType
    if (filters.level) where.level = filters.level
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    const approvals = await this.prisma.approval.findMany({
      where,
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
    return approvals as ApprovalWithDetails[]
  }

  async countMany(filters: ApprovalFilters): Promise<number> {
    const where: any = {}

    if (filters.requestId) where.requestId = filters.requestId
    if (filters.approverId) where.approverId = filters.approverId
    if (filters.status) where.status = filters.status
    if (filters.requestType) where.requestType = filters.requestType
    if (filters.level) where.level = filters.level
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    return await this.prisma.approval.count({ where })
  }

  async bulkApprove(ids: string[], approverId: string, comments?: string): Promise<number> {
    const result = await this.prisma.approval.updateMany({
      where: {
        id: { in: ids },
        approverId,
        status: ApprovalStatus.PENDING
      },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
        comments
      }
    })
    return result.count
  }

  async bulkReject(ids: string[], approverId: string, reason: string): Promise<number> {
    const result = await this.prisma.approval.updateMany({
      where: {
        id: { in: ids },
        approverId,
        status: ApprovalStatus.PENDING
      },
      data: {
        status: ApprovalStatus.REJECTED,
        rejectedAt: new Date(),
        comments: reason
      }
    })
    return result.count
  }

  async bulkDelegate(ids: string[], newApproverId: string, reason?: string): Promise<number> {
    const result = await this.prisma.approval.updateMany({
      where: {
        id: { in: ids },
        status: ApprovalStatus.PENDING
      },
      data: {
        approverId: newApproverId,
        comments: reason
      }
    })
    return result.count
  }

  async getPendingApprovals(approverId: string, limit?: number): Promise<ApprovalWithDetails[]> {
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverId,
        status: ApprovalStatus.PENDING
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    })
    return approvals as ApprovalWithDetails[]
  }

  async getOverdueApprovals(hours: number): Promise<ApprovalWithDetails[]> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    const approvals = await this.prisma.approval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        createdAt: {
          lte: cutoffDate
        }
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            nip: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    return approvals as ApprovalWithDetails[]
  }

  async getApprovalReminders(approverId: string): Promise<ApprovalWithDetails[]> {
    // Get approvals pending for more than 24 hours
    return await this.getOverdueApprovals(24)
  }

  async getApprovalStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
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
  }> {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (departmentId) {
      where.approver = {
        departmentId
      }
    }

    const [total, approved, rejected, pending, byType, byApprover] = await Promise.all([
      this.prisma.approval.count({ where }),
      this.prisma.approval.count({ where: { ...where, status: ApprovalStatus.APPROVED } }),
      this.prisma.approval.count({ where: { ...where, status: ApprovalStatus.REJECTED } }),
      this.prisma.approval.count({ where: { ...where, status: ApprovalStatus.PENDING } }),
      this.prisma.approval.groupBy({
        by: ['requestType'],
        where,
        _count: true
      }),
      this.prisma.approval.groupBy({
        by: ['approverId'],
        where,
        _count: {
          _all: true
        }
      })
    ])

    // Calculate average approval time
    const approvedApprovals = await this.prisma.approval.findMany({
      where: {
        ...where,
        status: ApprovalStatus.APPROVED,
        approvedAt: { not: null }
      },
      select: {
        createdAt: true,
        approvedAt: true
      }
    })

    const totalApprovalTime = approvedApprovals.reduce((sum, approval) => {
      if (approval.approvedAt) {
        return sum + (approval.approvedAt.getTime() - approval.createdAt.getTime())
      }
      return sum
    }, 0)

    const averageApprovalTime = approvedApprovals.length > 0
      ? totalApprovalTime / approvedApprovals.length / (1000 * 60 * 60) // Convert to hours
      : 0

    const byRequestType: Record<string, number> = {}
    byType.forEach(item => {
      byRequestType[item.requestType] = item._count
    })

    const byApproverResult: Record<string, any> = {}
    // This would need additional queries to get detailed approver statistics
    // For now, return simplified structure

    return {
      totalApprovals: total,
      approvedCount: approved,
      rejectedCount: rejected,
      pendingCount: pending,
      averageApprovalTime,
      byRequestType,
      byApprover: byApproverResult
    }
  }

  async findOverdueApprovals(hours: number): Promise<ApprovalWithDetails[]> {
    return await this.getOverdueApprovals(hours)
  }

  async escalateApproval(id: string, newApproverId: string, reason: string): Promise<ApprovalEntity> {
    const approval = await this.prisma.approval.update({
      where: { id },
      data: {
        approverId: newApproverId,
        comments: `Escalated: ${reason}`
      }
    })
    return approval
  }

  async getEscalationRules(requestType: 'LEAVE' | 'PERMISSION' | 'WORK_LETTER'): Promise<Array<{
    level: number
    hours: number
    escalateTo: string
  }>> {
    // This would typically be stored in database or configuration
    // For now, return default escalation rules
    const defaultRules = [
      { level: 1, hours: 24, escalateTo: 'supervisor' },
      { level: 2, hours: 48, escalateTo: 'manager' },
      { level: 3, hours: 72, escalateTo: 'director' }
    ]

    return defaultRules
  }
}
