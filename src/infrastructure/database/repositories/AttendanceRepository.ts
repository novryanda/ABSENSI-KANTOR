// ============================================================================
// ATTENDANCE REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/AttendanceRepository.ts
// ============================================================================

import { PrismaClient, AttendanceStatus } from '@prisma/client'
import {
  IAttendanceRepository,
  AttendanceEntity,
  CreateAttendanceData,
  UpdateAttendanceData,
  AttendanceFilters,
  AttendanceWithUser
} from '@/domain/repositories/IAttendanceRepository'

export class PrismaAttendanceRepository implements IAttendanceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<AttendanceEntity | null> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id }
    })
    return attendance
  }

  async create(data: CreateAttendanceData): Promise<AttendanceEntity> {
    const attendance = await this.prisma.attendance.create({
      data: {
        ...data,
        status: data.status || AttendanceStatus.PRESENT,
        workingHoursMinutes: data.workingHoursMinutes || 0,
        isValidLocation: data.isValidLocation ?? true
      }
    })
    return attendance
  }

  async update(id: string, data: UpdateAttendanceData): Promise<AttendanceEntity> {
    const attendance = await this.prisma.attendance.update({
      where: { id },
      data
    })
    return attendance
  }

  async delete(id: string): Promise<void> {
    await this.prisma.attendance.delete({
      where: { id }
    })
  }

  async findByUserAndDate(userId: string, date: Date): Promise<AttendanceEntity | null> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
    return attendance
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceEntity[]> {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        attendanceDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        attendanceDate: 'desc'
      }
    })
    return attendances
  }

  async findByDate(date: Date): Promise<AttendanceWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
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
        }
      },
      orderBy: {
        checkInTime: 'asc'
      }
    })
    return attendances as AttendanceWithUser[]
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AttendanceWithUser[]> {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
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
        }
      },
      orderBy: [
        { attendanceDate: 'desc' },
        { checkInTime: 'asc' }
      ]
    })
    return attendances as AttendanceWithUser[]
  }

  async findByDepartmentAndDate(departmentId: string, date: Date): Promise<AttendanceWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay
        },
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
        }
      },
      orderBy: {
        checkInTime: 'asc'
      }
    })
    return attendances as AttendanceWithUser[]
  }

  async findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<AttendanceWithUser[]> {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: endDate
        },
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
        }
      },
      orderBy: [
        { attendanceDate: 'desc' },
        { checkInTime: 'asc' }
      ]
    })
    return attendances as AttendanceWithUser[]
  }

  async countByStatus(status: AttendanceStatus, date?: Date): Promise<number> {
    const whereClause: any = { status }
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.attendanceDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const count = await this.prisma.attendance.count({
      where: whereClause
    })
    return count
  }

  async countByUserAndStatus(userId: string, status: AttendanceStatus, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = { userId, status }
    
    if (startDate && endDate) {
      whereClause.attendanceDate = {
        gte: startDate,
        lte: endDate
      }
    }

    const count = await this.prisma.attendance.count({
      where: whereClause
    })
    return count
  }

  async countByDepartmentAndStatus(departmentId: string, status: AttendanceStatus, date?: Date): Promise<number> {
    const whereClause: any = {
      status,
      user: {
        departmentId
      }
    }
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.attendanceDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const count = await this.prisma.attendance.count({
      where: whereClause
    })
    return count
  }

  async findLateArrivals(date: Date, lateThresholdMinutes: number = 0): Promise<AttendanceWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Assuming work starts at 8:00 AM
    const workStartTime = new Date(date)
    workStartTime.setHours(8, lateThresholdMinutes, 0, 0)

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        checkInTime: {
          gt: workStartTime
        },
        status: AttendanceStatus.PRESENT
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
        }
      },
      orderBy: {
        checkInTime: 'desc'
      }
    })
    return attendances as AttendanceWithUser[]
  }

  async findAbsentUsers(date: Date, departmentId?: string): Promise<string[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const whereClause: any = {
      attendanceDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: AttendanceStatus.ABSENT
    }

    if (departmentId) {
      whereClause.user = {
        departmentId
      }
    }

    const attendances = await this.prisma.attendance.findMany({
      where: whereClause,
      select: {
        userId: true
      }
    })
    
    return attendances.map(a => a.userId)
  }

  async findOvertimeAttendances(date: Date, overtimeThresholdMinutes: number = 480): Promise<AttendanceWithUser[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        workingHoursMinutes: {
          gt: overtimeThresholdMinutes
        },
        status: AttendanceStatus.PRESENT
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
        }
      },
      orderBy: {
        workingHoursMinutes: 'desc'
      }
    })
    return attendances as AttendanceWithUser[]
  }

  async findMany(filters: AttendanceFilters, limit?: number, offset?: number): Promise<AttendanceWithUser[]> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.status) whereClause.status = filters.status
    if (filters.isValidLocation !== undefined) whereClause.isValidLocation = filters.isValidLocation
    
    if (filters.startDate && filters.endDate) {
      whereClause.attendanceDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const attendances = await this.prisma.attendance.findMany({
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
        }
      },
      orderBy: [
        { attendanceDate: 'desc' },
        { checkInTime: 'asc' }
      ],
      take: limit,
      skip: offset
    })
    return attendances as AttendanceWithUser[]
  }

  async countMany(filters: AttendanceFilters): Promise<number> {
    const whereClause: any = {}

    if (filters.userId) whereClause.userId = filters.userId
    if (filters.status) whereClause.status = filters.status
    if (filters.isValidLocation !== undefined) whereClause.isValidLocation = filters.isValidLocation
    
    if (filters.startDate && filters.endDate) {
      whereClause.attendanceDate = {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    if (filters.departmentId) {
      whereClause.user = {
        departmentId: filters.departmentId
      }
    }

    const count = await this.prisma.attendance.count({
      where: whereClause
    })
    return count
  }

  async findTodayAttendance(userId: string): Promise<AttendanceEntity | null> {
    const today = new Date()
    return this.findByUserAndDate(userId, today)
  }

  async hasCheckedIn(userId: string, date: Date): Promise<boolean> {
    const attendance = await this.findByUserAndDate(userId, date)
    return attendance?.checkInTime !== null
  }

  async hasCheckedOut(userId: string, date: Date): Promise<boolean> {
    const attendance = await this.findByUserAndDate(userId, date)
    return attendance?.checkOutTime !== null
  }

  calculateWorkingHours(checkInTime: Date, checkOutTime: Date): number {
    const diffInMs = checkOutTime.getTime() - checkInTime.getTime()
    return Math.floor(diffInMs / (1000 * 60)) // Return in minutes
  }

  async calculateMonthlyWorkingHours(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const attendances = await this.findByUserAndDateRange(userId, startDate, endDate)
    return attendances.reduce((total, attendance) => total + attendance.workingHoursMinutes, 0)
  }

  async validateLocation(latitude: number, longitude: number, officeLocationId?: string): Promise<boolean> {
    // This would typically check against office locations in the database
    // For now, return true as a placeholder
    return true
  }

  async getAttendanceRate(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const totalDays = this.calculateWorkDays(startDate, endDate)
    const presentDays = await this.countByUserAndStatus(userId, AttendanceStatus.PRESENT, startDate, endDate)
    
    return totalDays > 0 ? (presentDays / totalDays) * 100 : 0
  }

  async getDepartmentAttendanceRate(departmentId: string, startDate: Date, endDate: Date): Promise<number> {
    // Get all users in department
    const users = await this.prisma.user.findMany({
      where: { departmentId },
      select: { id: true }
    })

    if (users.length === 0) return 0

    const totalWorkDays = this.calculateWorkDays(startDate, endDate) * users.length
    
    const presentDays = await this.prisma.attendance.count({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: endDate
        },
        status: AttendanceStatus.PRESENT,
        user: {
          departmentId
        }
      }
    })

    return totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0
  }

  async getCompanyAttendanceRate(startDate: Date, endDate: Date): Promise<number> {
    const totalUsers = await this.prisma.user.count({
      where: { status: 'ACTIVE' }
    })

    if (totalUsers === 0) return 0

    const totalWorkDays = this.calculateWorkDays(startDate, endDate) * totalUsers
    
    const presentDays = await this.prisma.attendance.count({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: endDate
        },
        status: AttendanceStatus.PRESENT
      }
    })

    return totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0
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
}
