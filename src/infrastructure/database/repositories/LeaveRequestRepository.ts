// ============================================================================
// LEAVE REQUEST REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/LeaveRequestRepository.ts
// ============================================================================

import { PrismaClient, LeaveType, RequestStatus } from '@prisma/client'
import {
  ILeaveRequestRepository,
  LeaveRequestEntity,
  CreateLeaveRequestData,
  UpdateLeaveRequestData,
  LeaveRequestFilters,
  LeaveRequestWithUser,
  LeaveBalance
} from '@/domain/repositories/ILeaveRequestRepository'

export class PrismaLeaveRequestRepository implements ILeaveRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<LeaveRequestEntity | null> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id }
    })
    return request
  }

  async findByIdWithUser(id: string): Promise<LeaveRequestWithUser | null> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return request as LeaveRequestWithUser | null
  }

  async create(data: CreateLeaveRequestData): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.create({
      data: {
        ...data,
        status: RequestStatus.PENDING,
        submittedAt: new Date()
      }
    })
    return request
  }

  async update(id: string, data: UpdateLeaveRequestData): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data
    })
    return request
  }

  async delete(id: string): Promise<void> {
    await this.prisma.leaveRequest.delete({
      where: { id }
    })
  }

  async findByUserId(userId: string): Promise<LeaveRequestEntity[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' }
    })
    return requests
  }

  async findByUserIdWithDetails(userId: string): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { userId },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findByUserAndStatus(userId: string, status: RequestStatus): Promise<LeaveRequestEntity[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { userId, status },
      orderBy: { submittedAt: 'desc' }
    })
    return requests
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<LeaveRequestEntity[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        userId,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      },
      orderBy: { startDate: 'desc' }
    })
    return requests
  }

  async findByApproverId(approverId: string): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { currentApproverId: approverId },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findPendingByApprover(approverId: string): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        currentApproverId: approverId,
        status: RequestStatus.PENDING
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findByApproverAndStatus(approverId: string, status: RequestStatus): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        currentApproverId: approverId,
        status
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findByDepartment(departmentId: string): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        user: {
          departmentId
        }
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findByDepartmentAndStatus(departmentId: string, status: RequestStatus): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        status,
        user: {
          departmentId
        }
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        user: {
          departmentId
        },
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async approve(id: string, approverId: string, comments?: string): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approvedAt: new Date(),
        rejectionReason: comments
      }
    })
    return request
  }

  async reject(id: string, approverId: string, reason: string): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    })
    return request
  }

  async cancel(id: string, reason?: string): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        rejectionReason: reason
      }
    })
    return request
  }

  async findMany(filters: LeaveRequestFilters, limit?: number, offset?: number): Promise<LeaveRequestWithUser[]> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.leaveType) whereClause.leaveType = filters.leaveType
    if (filters.status) whereClause.status = filters.status
    if (filters.currentApproverId) whereClause.currentApproverId = filters.currentApproverId

    if (filters.startDate && filters.endDate) {
      whereClause.OR = [
        {
          startDate: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        {
          endDate: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        }
      ]
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const requests = await this.prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      skip: offset
    })
    return requests as LeaveRequestWithUser[]
  }

  async countMany(filters: LeaveRequestFilters): Promise<number> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.leaveType) whereClause.leaveType = filters.leaveType
    if (filters.status) whereClause.status = filters.status
    if (filters.currentApproverId) whereClause.currentApproverId = filters.currentApproverId

    if (filters.startDate && filters.endDate) {
      whereClause.OR = [
        {
          startDate: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        {
          endDate: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        }
      ]
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })
    return count
  }

  async countByStatus(status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = { status }

    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })
    return count
  }

  async countByUserAndStatus(userId: string, status: RequestStatus, year?: number): Promise<number> {
    const whereClause: any = { userId, status }

    if (year) {
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
      whereClause.submittedAt = {
        gte: startOfYear,
        lte: endOfYear
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })
    return count
  }

  async countByDepartmentAndStatus(departmentId: string, status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = {
      status,
      user: {
        departmentId
      }
    }

    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })
    return count
  }

  async countByLeaveType(leaveType: LeaveType, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = { leaveType }

    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })
    return count
  }

  async calculateUsedLeaveDays(userId: string, leaveType: LeaveType, year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

    const result = await this.prisma.leaveRequest.aggregate({
      where: {
        userId,
        leaveType,
        status: RequestStatus.APPROVED,
        startDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      _sum: {
        totalDays: true
      }
    })

    return result._sum.totalDays || 0
  }

  async getLeaveBalance(userId: string, leaveType: LeaveType, year: number): Promise<LeaveBalance> {
    const usedDays = await this.calculateUsedLeaveDays(userId, leaveType, year)
    
    // Get total days from leave policy (this would typically come from a settings table)
    const totalDays = this.getLeaveAllowance(leaveType)
    
    return {
      userId,
      leaveType,
      totalDays,
      usedDays,
      remainingDays: totalDays - usedDays,
      year
    }
  }

  async getAllLeaveBalances(userId: string, year: number): Promise<LeaveBalance[]> {
    const leaveTypes = Object.values(LeaveType)
    const balances = await Promise.all(
      leaveTypes.map(type => this.getLeaveBalance(userId, type, year))
    )
    return balances
  }

  async hasConflictingLeave(userId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<boolean> {
    const whereClause: any = {
      userId,
      status: {
        in: [RequestStatus.PENDING, RequestStatus.APPROVED]
      },
      OR: [
        {
          startDate: {
            lte: endDate
          },
          endDate: {
            gte: startDate
          }
        }
      ]
    }

    if (excludeId) {
      whereClause.id = {
        not: excludeId
      }
    }

    const count = await this.prisma.leaveRequest.count({
      where: whereClause
    })

    return count > 0
  }

  async findConflictingRequests(userId: string, startDate: Date, endDate: Date): Promise<LeaveRequestEntity[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        userId,
        status: {
          in: [RequestStatus.PENDING, RequestStatus.APPROVED]
        },
        OR: [
          {
            startDate: {
              lte: endDate
            },
            endDate: {
              gte: startDate
            }
          }
        ]
      }
    })
    return requests
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findActiveLeavesByDate(date: Date): Promise<LeaveRequestWithUser[]> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        status: RequestStatus.APPROVED,
        startDate: {
          lte: date
        },
        endDate: {
          gte: date
        }
      },
      include: {
        user: {
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
        },
        currentApprover: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return requests as LeaveRequestWithUser[]
  }

  async findUpcomingLeaves(userId: string, days: number): Promise<LeaveRequestEntity[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        startDate: {
          gte: today,
          lte: futureDate
        }
      },
      orderBy: { startDate: 'asc' }
    })
    return requests
  }

  async bulkUpdateStatus(ids: string[], status: RequestStatus, approverId?: string): Promise<number> {
    const updateData: any = { status }
    
    if (status === RequestStatus.APPROVED) {
      updateData.approvedAt = new Date()
    } else if (status === RequestStatus.REJECTED) {
      updateData.rejectedAt = new Date()
    }

    const result = await this.prisma.leaveRequest.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: updateData
    })
    return result.count
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await this.prisma.leaveRequest.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
    return result.count
  }

  async getLeaveStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    byLeaveType: Record<LeaveType, number>
  }> {
    const whereClause: any = {
      submittedAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (departmentId) {
      whereClause.user = {
        departmentId
      }
    }

    const [total, approved, rejected, pending, byType] = await Promise.all([
      this.prisma.leaveRequest.count({ where: whereClause }),
      this.prisma.leaveRequest.count({ where: { ...whereClause, status: RequestStatus.APPROVED } }),
      this.prisma.leaveRequest.count({ where: { ...whereClause, status: RequestStatus.REJECTED } }),
      this.prisma.leaveRequest.count({ where: { ...whereClause, status: RequestStatus.PENDING } }),
      this.prisma.leaveRequest.groupBy({
        by: ['leaveType'],
        where: whereClause,
        _count: true
      })
    ])

    const byLeaveType: Record<LeaveType, number> = {} as Record<LeaveType, number>
    Object.values(LeaveType).forEach(type => {
      byLeaveType[type] = 0
    })
    
    byType.forEach(item => {
      byLeaveType[item.leaveType] = item._count
    })

    return {
      totalRequests: total,
      approvedRequests: approved,
      rejectedRequests: rejected,
      pendingRequests: pending,
      byLeaveType
    }
  }

  async getNextApprover(requestId: string): Promise<string | null> {
    // This would implement approval workflow logic
    // For now, return null as placeholder
    return null
  }

  async updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<LeaveRequestEntity> {
    const request = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        currentApproverId: nextApproverId
      }
    })
    return request
  }

  private getLeaveAllowance(leaveType: LeaveType): number {
    // This would typically come from a settings table or configuration
    const allowances: Record<LeaveType, number> = {
      [LeaveType.ANNUAL]: 12,
      [LeaveType.SICK]: 12,
      [LeaveType.MATERNITY]: 90,
      [LeaveType.PATERNITY]: 2,
      [LeaveType.EMERGENCY]: 2,
      [LeaveType.UNPAID]: 0
    }
    return allowances[leaveType] || 0
  }
}
