// ============================================================================
// ATTENDANCE REPOSITORY INTERFACE
// src/domain/repositories/IAttendanceRepository.ts
// ============================================================================

import { AttendanceStatus } from '@prisma/client'

export interface AttendanceEntity {
  id: string
  userId: string
  officeLocationId?: string
  attendanceDate: Date
  checkInTime?: Date
  checkOutTime?: Date
  checkInLatitude?: number
  checkInLongitude?: number
  checkOutLatitude?: number
  checkOutLongitude?: number
  checkInAddress?: string
  checkOutAddress?: string
  status: AttendanceStatus
  notes?: string
  workingHoursMinutes: number
  isValidLocation: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateAttendanceData {
  userId: string
  officeLocationId?: string
  attendanceDate: Date
  checkInTime?: Date
  checkOutTime?: Date
  checkInLatitude?: number
  checkInLongitude?: number
  checkOutLatitude?: number
  checkOutLongitude?: number
  checkInAddress?: string
  checkOutAddress?: string
  status?: AttendanceStatus
  notes?: string
  workingHoursMinutes?: number
  isValidLocation?: boolean
}

export interface UpdateAttendanceData {
  checkOutTime?: Date
  checkOutLatitude?: number
  checkOutLongitude?: number
  checkOutAddress?: string
  status?: AttendanceStatus
  notes?: string
  workingHoursMinutes?: number
  isValidLocation?: boolean
}

export interface AttendanceFilters {
  userId?: string
  departmentId?: string
  status?: AttendanceStatus
  startDate?: Date
  endDate?: Date
  isValidLocation?: boolean
}

export interface AttendanceWithUser extends AttendanceEntity {
  user: {
    id: string
    name: string
    nip?: string
    department?: {
      id: string
      name: string
    }
  }
}

export interface IAttendanceRepository {
  // Basic CRUD operations
  findById(id: string): Promise<AttendanceEntity | null>
  create(data: CreateAttendanceData): Promise<AttendanceEntity>
  update(id: string, data: UpdateAttendanceData): Promise<AttendanceEntity>
  delete(id: string): Promise<void>

  // Specific queries for dashboard and business logic
  findByUserAndDate(userId: string, date: Date): Promise<AttendanceEntity | null>
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceEntity[]>
  findByDate(date: Date): Promise<AttendanceWithUser[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<AttendanceWithUser[]>
  
  // Department and team queries
  findByDepartmentAndDate(departmentId: string, date: Date): Promise<AttendanceWithUser[]>
  findByDepartmentAndDateRange(departmentId: string, startDate: Date, endDate: Date): Promise<AttendanceWithUser[]>
  
  // Statistics and reporting
  countByStatus(status: AttendanceStatus, date?: Date): Promise<number>
  countByUserAndStatus(userId: string, status: AttendanceStatus, startDate?: Date, endDate?: Date): Promise<number>
  countByDepartmentAndStatus(departmentId: string, status: AttendanceStatus, date?: Date): Promise<number>
  
  // Advanced queries
  findLateArrivals(date: Date, lateThresholdMinutes?: number): Promise<AttendanceWithUser[]>
  findAbsentUsers(date: Date, departmentId?: string): Promise<string[]>
  findOvertimeAttendances(date: Date, overtimeThresholdMinutes?: number): Promise<AttendanceWithUser[]>
  
  // Bulk operations
  findMany(filters: AttendanceFilters, limit?: number, offset?: number): Promise<AttendanceWithUser[]>
  countMany(filters: AttendanceFilters): Promise<number>
  
  // Check-in/Check-out specific
  findTodayAttendance(userId: string): Promise<AttendanceEntity | null>
  hasCheckedIn(userId: string, date: Date): Promise<boolean>
  hasCheckedOut(userId: string, date: Date): Promise<boolean>
  
  // Working hours calculations
  calculateWorkingHours(checkInTime: Date, checkOutTime: Date): number
  calculateMonthlyWorkingHours(userId: string, year: number, month: number): Promise<number>
  
  // Location validation
  validateLocation(latitude: number, longitude: number, officeLocationId?: string): Promise<boolean>
  
  // Reporting helpers
  getAttendanceRate(userId: string, startDate: Date, endDate: Date): Promise<number>
  getDepartmentAttendanceRate(departmentId: string, startDate: Date, endDate: Date): Promise<number>
  getCompanyAttendanceRate(startDate: Date, endDate: Date): Promise<number>
}
