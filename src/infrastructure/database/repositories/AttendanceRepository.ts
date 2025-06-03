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
import { normalizeToStartOfDay, normalizeToEndOfDay, getAttendanceDate, isAttendancePresent } from '@/utils/dateUtils'

export class PrismaAttendanceRepository implements IAttendanceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<AttendanceEntity | null> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id }
    })
    return attendance
  }

  async create(data: CreateAttendanceData): Promise<AttendanceEntity> {
    // CRITICAL: Normalize attendance date to prevent unique constraint violations
    const normalizedData = {
      ...data,
      attendanceDate: getAttendanceDate(data.attendanceDate),
      status: data.status || AttendanceStatus.PRESENT,
      workingHoursMinutes: data.workingHoursMinutes || 0,
      isValidLocation: data.isValidLocation ?? true
    }

    console.log('💾 Creating attendance with normalized data:', {
      userId: normalizedData.userId,
      attendanceDate: normalizedData.attendanceDate.toISOString(),
      originalDate: data.attendanceDate.toISOString()
    })

    try {
      const attendance = await this.prisma.attendance.create({
        data: normalizedData
      })
      console.log('✅ Attendance created successfully:', attendance.id)
      return attendance
    } catch (error: any) {
      console.error('❌ Failed to create attendance:', error)

      // Handle unique constraint violation specifically
      if (error.code === 'P2002' && error.meta?.target?.includes('userId') && error.meta?.target?.includes('attendanceDate')) {
        throw new Error('Anda sudah melakukan check-in hari ini')
      }

      throw error
    }
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
    // CRITICAL: Use the same normalization as create method
    const normalizedDate = getAttendanceDate(date)

    console.log('🔍 findByUserAndDate called with:', {
      userId,
      originalDate: date.toISOString(),
      normalizedDate: normalizedDate.toISOString()
    })

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        attendanceDate: normalizedDate
      },
      include: {
        officeLocation: {
          select: {
            id: true,
            name: true,
            code: true,
            latitude: true,
            longitude: true,
            radiusMeters: true
          }
        }
      }
    })

    console.log('📊 findByUserAndDate result:', attendance ? {
      id: attendance.id,
      attendanceDate: attendance.attendanceDate.toISOString(),
      workingHoursMinutes: attendance.workingHoursMinutes,
      checkInTime: attendance.checkInTime?.toISOString(),
      checkOutTime: attendance.checkOutTime?.toISOString()
    } : 'No attendance found')
    return attendance
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceEntity[]> {
    // CRITICAL: Normalize dates for consistent database queries
    const normalizedStartDate = normalizeToStartOfDay(startDate)
    const normalizedEndDate = normalizeToEndOfDay(endDate)

    console.log('🔍 findByUserAndDateRange called with:', {
      userId,
      originalStartDate: startDate.toISOString(),
      originalEndDate: endDate.toISOString(),
      normalizedStartDate: normalizedStartDate.toISOString(),
      normalizedEndDate: normalizedEndDate.toISOString()
    })

    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        attendanceDate: {
          gte: normalizedStartDate,
          lte: normalizedEndDate
        }
      },
      orderBy: {
        attendanceDate: 'desc'
      }
    })

    console.log('📊 findByUserAndDateRange result:', {
      count: attendances.length,
      sample: attendances[0] ? {
        id: attendances[0].id,
        attendanceDate: attendances[0].attendanceDate.toISOString(),
        attendanceDateLocal: attendances[0].attendanceDate.toLocaleDateString('id-ID'),
        status: attendances[0].status
      } : 'No attendances found'
    })

    return attendances
  }

  async findByDate(date: Date): Promise<AttendanceWithUser[]> {
    // FIXED: Use consistent date normalization functions
    const startOfDay = normalizeToStartOfDay(date)
    const endOfDay = normalizeToEndOfDay(date)

    console.log('🔍 findByDate with normalized dates:', {
      input: date.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    })

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
    // FIXED: Use consistent date normalization functions
    const startOfDay = normalizeToStartOfDay(date)
    const endOfDay = normalizeToEndOfDay(date)

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
      // FIXED: Use consistent date normalization functions
      const startOfDay = normalizeToStartOfDay(date)
      const endOfDay = normalizeToEndOfDay(date)

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
      // FIXED: Use consistent date normalization functions
      const startOfDay = normalizeToStartOfDay(date)
      const endOfDay = normalizeToEndOfDay(date)

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
    // FIXED: Use consistent date normalization functions
    const startOfDay = normalizeToStartOfDay(date)
    const endOfDay = normalizeToEndOfDay(date)

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
    // FIXED: Use consistent date normalization functions
    const startOfDay = normalizeToStartOfDay(date)
    const endOfDay = normalizeToEndOfDay(date)

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
    // FIXED: Use consistent date normalization functions
    const startOfDay = normalizeToStartOfDay(date)
    const endOfDay = normalizeToEndOfDay(date)

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
    // Use normalized today date for consistency
    const today = getAttendanceDate()
    return this.findByUserAndDate(userId, today)
  }

  async hasCheckedIn(userId: string, date: Date): Promise<boolean> {
    const attendance = await this.findByUserAndDate(userId, date)
    return attendance !== null && attendance.checkInTime !== null
  }

  async hasCheckedOut(userId: string, date: Date): Promise<boolean> {
    const attendance = await this.findByUserAndDate(userId, date)
    return attendance !== null && attendance.checkOutTime !== null
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
    try {
      // Import the location validation service
      const { LocationValidationService } = await import('@/infrastructure/services/LocationValidationService')
      const { PrismaOfficeLocationRepository } = await import('@/infrastructure/database/repositories/OfficeLocationRepository')

      const officeLocationRepository = new PrismaOfficeLocationRepository(this.prisma)
      const locationValidationService = new LocationValidationService(officeLocationRepository)

      if (officeLocationId) {
        // Validate against specific office location
        const result = await locationValidationService.validateAgainstOfficeLocation(
          latitude,
          longitude,
          officeLocationId
        )
        return result.isValid
      } else {
        // Validate against any active office location
        const result = await locationValidationService.validateUserLocation(latitude, longitude)
        return result.isValid
      }
    } catch (error) {
      console.error('Error validating location:', error)
      // Return false for safety if validation fails
      return false
    }
  }

  async getAttendanceRate(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const totalDays = this.calculateWorkDays(startDate, endDate)

    // Get all attendance records for the user in the date range
    const attendances = await this.findByUserAndDateRange(userId, startDate, endDate)

    // Count present days using consistent logic (PRESENT + LATE = present)
    const presentDays = attendances.filter(a => isAttendancePresent(a.status)).length

    console.log('📊 getAttendanceRate calculation:', {
      userId,
      totalDays,
      presentDays,
      attendanceRecords: attendances.length,
      rate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    })

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

    // Get all attendance records for the department in the date range
    const attendances = await this.findByDepartmentAndDateRange(departmentId, startDate, endDate)

    // Count present days using consistent logic (PRESENT + LATE = present)
    const presentDays = attendances.filter(a => isAttendancePresent(a.status)).length

    console.log('📊 getDepartmentAttendanceRate calculation:', {
      departmentId,
      totalUsers: users.length,
      totalWorkDays,
      presentDays,
      attendanceRecords: attendances.length,
      rate: totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0
    })

    return totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0
  }

  async getCompanyAttendanceRate(startDate: Date, endDate: Date): Promise<number> {
    const totalUsers = await this.prisma.user.count({
      where: { status: 'ACTIVE' }
    })

    if (totalUsers === 0) return 0

    const totalWorkDays = this.calculateWorkDays(startDate, endDate) * totalUsers

    // Get all attendance records for the date range
    const attendances = await this.findByDateRange(startDate, endDate)

    // Count present days using consistent logic (PRESENT + LATE = present)
    const presentDays = attendances.filter(a => isAttendancePresent(a.status)).length

    console.log('📊 getCompanyAttendanceRate calculation:', {
      totalUsers,
      totalWorkDays,
      presentDays,
      attendanceRecords: attendances.length,
      rate: totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0
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
