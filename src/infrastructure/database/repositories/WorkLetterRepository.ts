// ============================================================================
// WORK LETTER REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/WorkLetterRepository.ts
// ============================================================================

import { PrismaClient, WorkLetterType, RequestStatus } from '@prisma/client'
import {
  IWorkLetterRepository,
  WorkLetterEntity,
  CreateWorkLetterData,
  UpdateWorkLetterData,
  WorkLetterFilters,
  WorkLetterWithUser
} from '@/domain/repositories/IWorkLetterRepository'

export class PrismaWorkLetterRepository implements IWorkLetterRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<WorkLetterEntity | null> {
    const workLetter = await this.prisma.workLetter.findUnique({
      where: { id }
    })
    return workLetter
  }

  async findByIdWithUser(id: string): Promise<WorkLetterWithUser | null> {
    const workLetter = await this.prisma.workLetter.findUnique({
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
    return workLetter as WorkLetterWithUser | null
  }

  async create(data: CreateWorkLetterData): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.create({
      data: {
        ...data,
        status: RequestStatus.PENDING,
        submittedAt: new Date()
      }
    })
    return workLetter
  }

  async update(id: string, data: UpdateWorkLetterData): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id },
      data
    })
    return workLetter
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workLetter.delete({
      where: { id }
    })
  }

  async findByUserId(userId: string): Promise<WorkLetterEntity[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' }
    })
    return workLetters
  }

  async findByUserIdWithDetails(userId: string): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
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
    return workLetters as WorkLetterWithUser[]
  }

  async findByUserAndStatus(userId: string, status: RequestStatus): Promise<WorkLetterEntity[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: { 
        userId,
        status 
      },
      orderBy: { submittedAt: 'desc' }
    })
    return workLetters
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkLetterEntity[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { startDate: 'asc' }
    })
    return workLetters
  }

  async findByStatus(status: RequestStatus): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: { status },
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
    return workLetters as WorkLetterWithUser[]
  }

  async findByApprover(approverId: string): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
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
    return workLetters as WorkLetterWithUser[]
  }

  async findByDepartment(departmentId: string): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
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
    return workLetters as WorkLetterWithUser[]
  }

  async findByLetterNumber(letterNumber: string): Promise<WorkLetterEntity | null> {
    const workLetter = await this.prisma.workLetter.findUnique({
      where: { letterNumber }
    })
    return workLetter
  }

  async generateLetterNumber(workLetterType: WorkLetterType, year: number): Promise<string> {
    // Get the count of work letters for this type and year
    const count = await this.prisma.workLetter.count({
      where: {
        workLetterType,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    })

    // Generate letter number based on type
    const typeCode = workLetterType === WorkLetterType.BUSINESS_TRIP ? 'PD' : 
                     workLetterType === WorkLetterType.ASSIGNMENT ? 'TG' : 'SK'
    
    const sequence = String(count + 1).padStart(3, '0')
    return `${sequence}/${typeCode}/${year}`
  }

  async assignLetterNumber(id: string): Promise<WorkLetterEntity> {
    const workLetter = await this.findById(id)
    if (!workLetter) {
      throw new Error('Work letter not found')
    }

    const year = new Date().getFullYear()
    const letterNumber = await this.generateLetterNumber(workLetter.workLetterType, year)

    return await this.update(id, { letterNumber })
  }

  async approve(id: string, approverId: string, comments?: string): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approvedAt: new Date(),
        rejectionReason: comments
      }
    })
    return workLetter
  }

  async reject(id: string, approverId: string, reason: string): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    })
    return workLetter
  }

  async cancel(id: string, reason?: string): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        rejectionReason: reason
      }
    })
    return workLetter
  }

  async issue(id: string): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id },
      data: {
        issuedAt: new Date()
      }
    })
    return workLetter
  }

  async findMany(filters: WorkLetterFilters, limit?: number, offset?: number): Promise<WorkLetterWithUser[]> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.status) where.status = filters.status
    if (filters.workLetterType) where.workLetterType = filters.workLetterType
    if (filters.departmentId) {
      where.user = { departmentId: filters.departmentId }
    }
    if (filters.startDate && filters.endDate) {
      where.startDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    const workLetters = await this.prisma.workLetter.findMany({
      where,
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
    return workLetters as WorkLetterWithUser[]
  }

  async countMany(filters: WorkLetterFilters): Promise<number> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.status) where.status = filters.status
    if (filters.workLetterType) where.workLetterType = filters.workLetterType
    if (filters.departmentId) {
      where.user = { departmentId: filters.departmentId }
    }
    if (filters.startDate && filters.endDate) {
      where.startDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    return await this.prisma.workLetter.count({ where })
  }

  async countByStatus(status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { status }

    if (startDate && endDate) {
      where.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    return await this.prisma.workLetter.count({ where })
  }

  async countByUserAndStatus(userId: string, status: RequestStatus, year?: number): Promise<number> {
    const where: any = { userId, status }

    if (year) {
      where.submittedAt = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      }
    }

    return await this.prisma.workLetter.count({ where })
  }

  async countByDepartmentAndStatus(departmentId: string, status: RequestStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = {
      status,
      user: { departmentId }
    }

    if (startDate && endDate) {
      where.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    return await this.prisma.workLetter.count({ where })
  }

  async countByWorkLetterType(workLetterType: WorkLetterType, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { workLetterType }

    if (startDate && endDate) {
      where.submittedAt = {
        gte: startDate,
        lte: endDate
      }
    }

    return await this.prisma.workLetter.count({ where })
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: {
        startDate: {
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
      orderBy: { startDate: 'asc' }
    })
    return workLetters as WorkLetterWithUser[]
  }

  async findActiveWorkLettersByDate(date: Date): Promise<WorkLetterWithUser[]> {
    const workLetters = await this.prisma.workLetter.findMany({
      where: {
        status: RequestStatus.APPROVED,
        startDate: { lte: date },
        endDate: { gte: date }
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
    return workLetters as WorkLetterWithUser[]
  }

  async findUpcomingWorkLetters(userId: string, days: number): Promise<WorkLetterEntity[]> {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const workLetters = await this.prisma.workLetter.findMany({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { startDate: 'asc' }
    })
    return workLetters
  }

  async getWorkLetterStatistics(startDate: Date, endDate: Date, departmentId?: string): Promise<{
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
    byWorkLetterType: Record<WorkLetterType, number>
  }> {
    const where: any = {
      submittedAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (departmentId) {
      where.user = { departmentId }
    }

    const [total, approved, rejected, pending, byType] = await Promise.all([
      this.prisma.workLetter.count({ where }),
      this.prisma.workLetter.count({ where: { ...where, status: RequestStatus.APPROVED } }),
      this.prisma.workLetter.count({ where: { ...where, status: RequestStatus.REJECTED } }),
      this.prisma.workLetter.count({ where: { ...where, status: RequestStatus.PENDING } }),
      this.prisma.workLetter.groupBy({
        by: ['workLetterType'],
        where,
        _count: true
      })
    ])

    const byWorkLetterType: Record<WorkLetterType, number> = {} as Record<WorkLetterType, number>
    Object.values(WorkLetterType).forEach(type => {
      byWorkLetterType[type] = 0
    })

    byType.forEach(item => {
      byWorkLetterType[item.workLetterType] = item._count
    })

    return {
      totalRequests: total,
      approvedRequests: approved,
      rejectedRequests: rejected,
      pendingRequests: pending,
      byWorkLetterType
    }
  }

  async getNextApprover(requestId: string): Promise<string | null> {
    // This would implement approval workflow logic
    // For now, return null as placeholder
    return null
  }

  async updateApprovalWorkflow(requestId: string, nextApproverId: string): Promise<WorkLetterEntity> {
    const workLetter = await this.prisma.workLetter.update({
      where: { id: requestId },
      data: {
        currentApproverId: nextApproverId
      }
    })
    return workLetter
  }

  async getWorkLetterTemplate(workLetterType: WorkLetterType): Promise<string> {
    // This would return template content based on work letter type
    // For now, return placeholder
    return `Template for ${workLetterType}`
  }

  async generateWorkLetterDocument(id: string): Promise<Buffer> {
    // This would generate PDF document
    // For now, return empty buffer
    return Buffer.from('')
  }

  async getWorkLetterPrintData(id: string): Promise<{
    letterNumber: string
    user: any
    workLetter: WorkLetterEntity
    approver: any
    company: any
  }> {
    const workLetter = await this.findByIdWithUser(id)
    if (!workLetter) {
      throw new Error('Work letter not found')
    }

    return {
      letterNumber: workLetter.letterNumber || '',
      user: workLetter.user,
      workLetter,
      approver: workLetter.currentApprover,
      company: {} // Would fetch company data
    }
  }

  isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate
  }

  getWorkLetterTypeLimit(workLetterType: WorkLetterType): number {
    // Return limits in days per year for each type
    switch (workLetterType) {
      case WorkLetterType.BUSINESS_TRIP:
        return 30 // 30 days per year
      case WorkLetterType.ASSIGNMENT:
        return 60 // 60 days per year
      default:
        return 15 // 15 days per year for other types
    }
  }

  async hasExceededYearlyLimit(userId: string, workLetterType: WorkLetterType, year: number): Promise<boolean> {
    const limit = this.getWorkLetterTypeLimit(workLetterType)

    const totalDays = await this.prisma.workLetter.aggregate({
      where: {
        userId,
        workLetterType,
        status: RequestStatus.APPROVED,
        submittedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      },
      _sum: {
        // This would need a duration field in the schema
        // For now, assume each request is 1 day
      }
    })

    // Calculate total days (simplified)
    const approvedRequests = await this.prisma.workLetter.count({
      where: {
        userId,
        workLetterType,
        status: RequestStatus.APPROVED,
        submittedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    })

    return approvedRequests >= limit
  }
}
