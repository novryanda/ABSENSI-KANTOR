// ============================================================================
// PERMISSION REQUEST REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/PermissionRequestRepository.ts
// ============================================================================

import { PrismaClient, PermissionType, RequestStatus } from '@prisma/client'
import {
  IPermissionRequestRepository,
  PermissionRequestEntity,
  CreatePermissionRequestData,
  UpdatePermissionRequestData,
  PermissionRequestFilters,
  PermissionRequestWithUser
} from '@/domain/repositories/IPermissionRequestRepository'

export class PrismaPermissionRequestRepository implements IPermissionRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PermissionRequestEntity | null> {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id }
    })
    return request
  }

  async findByIdWithUser(id: string): Promise<PermissionRequestWithUser | null> {
    const request = await this.prisma.permissionRequest.findUnique({
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
    return request as PermissionRequestWithUser | null
  }

  async create(data: CreatePermissionRequestData): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.create({
      data: {
        ...data,
        status: RequestStatus.PENDING,
        submittedAt: new Date()
      }
    })
    return request
  }

  async update(id: string, data: UpdatePermissionRequestData): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.update({
      where: { id },
      data
    })
    return request
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permissionRequest.delete({
      where: { id }
    })
  }

  async findByUserId(userId: string): Promise<PermissionRequestEntity[]> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' }
    })
    return requests
  }

  async findByUserIdWithDetails(userId: string): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findByUserAndStatus(userId: string, status: RequestStatus): Promise<PermissionRequestEntity[]> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: { userId, status },
      orderBy: { submittedAt: 'desc' }
    })
    return requests
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<PermissionRequestEntity[]> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        userId,
        permissionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { permissionDate: 'desc' }
    })
    return requests
  }

  async findByUserAndDate(userId: string, date: Date): Promise<PermissionRequestEntity[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        userId,
        permissionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { startTime: 'asc' }
    })
    return requests
  }

  async findByApproverId(approverId: string): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findPendingByApprover(approverId: string): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findByApproverAndStatus(approverId: string, status: RequestStatus): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findByDepartment(departmentId: string): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findByDepartmentAndStatus(departmentId: string, status: RequestStatus): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        user: {
          departmentId
        },
        permissionDate: {
          gte: startDate,
          lte: endDate
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
      orderBy: { permissionDate: 'desc' }
    })
    return requests as PermissionRequestWithUser[]
  }

  async findByDepartmentAndDate(departmentId: string, date: Date): Promise<PermissionRequestWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        user: {
          departmentId
        },
        permissionDate: {
          gte: startOfDay,
          lte: endOfDay
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
      orderBy: { startTime: 'asc' }
    })
    return requests as PermissionRequestWithUser[]
  }

  async approve(id: string, approverId: string, comments?: string): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approvedAt: new Date(),
        rejectionReason: comments
      }
    })
    return request
  }

  async reject(id: string, approverId: string, reason: string): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    })
    return request
  }

  async cancel(id: string, reason?: string): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        rejectionReason: reason
      }
    })
    return request
  }

  async findMany(filters: PermissionRequestFilters, limit?: number, offset?: number): Promise<PermissionRequestWithUser[]> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.permissionType) whereClause.permissionType = filters.permissionType
    if (filters.status) whereClause.status = filters.status
    if (filters.currentApproverId) whereClause.currentApproverId = filters.currentApproverId

    if (filters.permissionDate) {
      const startOfDay = new Date(filters.permissionDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(filters.permissionDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.permissionDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (filters.startDate && filters.endDate) {
      whereClause.permissionDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const requests = await this.prisma.permissionRequest.findMany({
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
    return requests as PermissionRequestWithUser[]
  }

  async countMany(filters: PermissionRequestFilters): Promise<number> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.permissionType) whereClause.permissionType = filters.permissionType
    if (filters.status) whereClause.status = filters.status
    if (filters.currentApproverId) whereClause.currentApproverId = filters.currentApproverId

    if (filters.permissionDate) {
      const startOfDay = new Date(filters.permissionDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(filters.permissionDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.permissionDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (filters.startDate && filters.endDate) {
      whereClause.permissionDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const count = await this.prisma.permissionRequest.count({
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

    const count = await this.prisma.permissionRequest.count({
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

    const count = await this.prisma.permissionRequest.count({
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

    const count = await this.prisma.permissionRequest.count({
      where: whereClause
    })
    return count
  }

  async countByPermissionType(permissionType: PermissionType, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = { permissionType }

    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const count = await this.prisma.permissionRequest.count({
      where: whereClause
    })
    return count
  }

  async hasTimeConflict(userId: string, permissionDate: Date, startTime: Date, endTime: Date, excludeId?: string): Promise<boolean> {
    const startOfDay = new Date(permissionDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(permissionDate)
    endOfDay.setHours(23, 59, 59, 999)

    const whereClause: any = {
      userId,
      permissionDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: [RequestStatus.PENDING, RequestStatus.APPROVED]
      },
      OR: [
        {
          startTime: {
            lt: endTime
          },
          endTime: {
            gt: startTime
          }
        }
      ]
    }

    if (excludeId) {
      whereClause.id = {
        not: excludeId
      }
    }

    const count = await this.prisma.permissionRequest.count({
      where: whereClause
    })

    return count > 0
  }

  async findConflictingRequests(userId: string, permissionDate: Date, startTime: Date, endTime: Date): Promise<PermissionRequestEntity[]> {
    const startOfDay = new Date(permissionDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(permissionDate)
    endOfDay.setHours(23, 59, 59, 999)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        userId,
        permissionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: [RequestStatus.PENDING, RequestStatus.APPROVED]
        },
        OR: [
          {
            startTime: {
              lt: endTime
            },
            endTime: {
              gt: startTime
            }
          }
        ]
      }
    })
    return requests
  }

  async findByDate(date: Date): Promise<PermissionRequestWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        permissionDate: {
          gte: startOfDay,
          lte: endOfDay
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
      orderBy: { startTime: 'asc' }
    })
    return requests as PermissionRequestWithUser[]
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<PermissionRequestWithUser[]> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        permissionDate: {
          gte: startDate,
          lte: endDate
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
      orderBy: [
        { permissionDate: 'asc' },
        { startTime: 'asc' }
      ]
    })
    return requests as PermissionRequestWithUser[]
  }

  async findActivePermissionsByDate(date: Date): Promise<PermissionRequestWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        status: RequestStatus.APPROVED,
        permissionDate: {
          gte: startOfDay,
          lte: endOfDay
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
      orderBy: { startTime: 'asc' }
    })
    return requests as PermissionRequestWithUser[]
  }

  async findUpcomingPermissions(userId: string, days: number): Promise<PermissionRequestEntity[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        permissionDate: {
          gte: today,
          lte: futureDate
        }
      },
      orderBy: { permissionDate: 'asc' }
    })
    return requests
  }

  calculatePermissionDuration(startTime: Date, endTime: Date): number {
    const diffInMs = endTime.getTime() - startTime.getTime()
    return Math.floor(diffInMs / (1000 * 60)) // Return in minutes
  }

  async getTotalPermissionHours(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const requests = await this.prisma.permissionRequest.findMany({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        permissionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    let totalMinutes = 0
    requests.forEach(request => {
      totalMinutes += this.calculatePermissionDuration(request.startTime, request.endTime)
    })

    return totalMinutes / 60 // Convert to hours
  }

  async getMonthlyPermissionHours(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    return this.getTotalPermissionHours(userId, startDate, endDate)
  }

  async bulkUpdateStatus(ids: string[], status: RequestStatus, approverId?: string): Promise<number> {
    const updateData: any = { status }
    
    if (status === RequestStatus.APPROVED) {
      updateData.approvedAt = new Date()
    } else if (status === RequestStatus.REJECTED) {
      updateData.rejectedAt = new Date()
    }

    const result = await this.prisma.permissionRequest.updateMany({
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
    const result = await this.prisma.permissionRequest.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
    return result.count
  }

  async getPermissionStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    byPermissionType: Record<PermissionType, number>
    totalHours: number
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

    const [total, approved, rejected, pending, byType, approvedRequests] = await Promise.all([
      this.prisma.permissionRequest.count({ where: whereClause }),
      this.prisma.permissionRequest.count({ where: { ...whereClause, status: RequestStatus.APPROVED } }),
      this.prisma.permissionRequest.count({ where: { ...whereClause, status: RequestStatus.REJECTED } }),
      this.prisma.permissionRequest.count({ where: { ...whereClause, status: RequestStatus.PENDING } }),
      this.prisma.permissionRequest.groupBy({
        by: ['permissionType'],
        where: whereClause,
        _count: true
      }),
      this.prisma.permissionRequest.findMany({
        where: { ...whereClause, status: RequestStatus.APPROVED },
        select: {
          startTime: true,
          endTime: true
        }
      })
    ])

    const byPermissionType: Record<PermissionType, number> = {} as Record<PermissionType, number>
    Object.values(PermissionType).forEach(type => {
      byPermissionType[type] = 0
    })
    
    byType.forEach(item => {
      byPermissionType[item.permissionType] = item._count
    })

    // Calculate total hours
    let totalMinutes = 0
    approvedRequests.forEach(request => {
      totalMinutes += this.calculatePermissionDuration(request.startTime, request.endTime)
    })

    return {
      totalRequests: total,
      approvedRequests: approved,
      rejectedRequests: rejected,
      pendingRequests: pending,
      byPermissionType,
      totalHours: totalMinutes / 60
    }
  }

  async getNextApprover(requestId: string): Promise<string | null> {
    // This would implement approval workflow logic
    // For now, return null as placeholder
    return null
  }

  async updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<PermissionRequestEntity> {
    const request = await this.prisma.permissionRequest.update({
      where: { id: requestId },
      data: {
        currentApproverId: nextApproverId
      }
    })
    return request
  }

  isValidTimeRange(startTime: Date, endTime: Date): boolean {
    return startTime < endTime
  }

  isWorkingHours(time: Date): boolean {
    const hour = time.getHours()
    return hour >= 8 && hour <= 17 // 8 AM to 5 PM
  }

  getPermissionTypeLimit(permissionType: PermissionType): number {
    // This would typically come from a settings table or configuration
    const limits: Record<PermissionType, number> = {
      [PermissionType.PERSONAL]: 8, // 8 hours per month
      [PermissionType.MEDICAL]: 16, // 16 hours per month
      [PermissionType.FAMILY]: 8, // 8 hours per month
      [PermissionType.OFFICIAL]: 0, // No limit
      [PermissionType.OTHER]: 4 // 4 hours per month
    }
    return limits[permissionType] || 0
  }

  async hasExceededMonthlyLimit(userId: string, permissionType: PermissionType, year: number, month: number): Promise<boolean> {
    const limit = this.getPermissionTypeLimit(permissionType)
    if (limit === 0) return false // No limit

    const usedHours = await this.getMonthlyPermissionHours(userId, year, month)
    return usedHours >= limit
  }
}
