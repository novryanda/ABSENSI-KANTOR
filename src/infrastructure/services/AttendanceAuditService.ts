// ============================================================================
// ATTENDANCE AUDIT SERVICE
// src/infrastructure/services/AttendanceAuditService.ts
// ============================================================================

import { PrismaClient, AttendanceStatus } from '@prisma/client'
import { logAuditAction } from '@/infrastructure/database/supabaseClient'

export interface AttendanceAuditData {
  action: 'CHECK_IN' | 'CHECK_OUT' | 'UPDATE_STATUS' | 'MANUAL_ENTRY'
  entityId: string
  entityType: 'ATTENDANCE'
  userId: string
  performedBy: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  reason?: string
  metadata?: {
    attendanceDate?: Date
    checkInTime?: Date
    checkOutTime?: Date
    workingHoursMinutes?: number
    status?: AttendanceStatus
    isValidLocation?: boolean
    locationInfo?: {
      latitude?: number
      longitude?: number
      address?: string
      officeLocationId?: string
    }
  }
}

export class AttendanceAuditService {
  constructor(private prisma: PrismaClient) {}

  async logAction(data: AttendanceAuditData): Promise<void> {
    try {
      // Log to audit_logs table
      await this.prisma.auditLog.create({
        data: {
          userId: data.performedBy,
          action: data.action,
          tableName: 'attendance',
          recordId: data.entityId,
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })

      // Also log to Supabase audit system for backup
      await logAuditAction({
        userId: data.performedBy,
        action: data.action,
        tableName: 'attendance',
        recordId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      })

      console.log(`✅ Attendance audit logged: ${data.action} for attendance ${data.entityId}`)
    } catch (error) {
      console.error('Failed to log attendance audit:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  async logCheckIn(
    attendanceId: string,
    userId: string,
    attendanceData: {
      attendanceDate: Date
      checkInTime: Date
      status: AttendanceStatus
      workingHoursMinutes: number
      isValidLocation: boolean
      latitude?: number
      longitude?: number
      address?: string
      officeLocationId?: string
    },
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'CHECK_IN',
      entityId: attendanceId,
      entityType: 'ATTENDANCE',
      userId,
      performedBy,
      newValues: {
        attendanceDate: attendanceData.attendanceDate.toISOString(),
        checkInTime: attendanceData.checkInTime.toISOString(),
        status: attendanceData.status,
        workingHoursMinutes: attendanceData.workingHoursMinutes,
        isValidLocation: attendanceData.isValidLocation,
        checkInLatitude: attendanceData.latitude,
        checkInLongitude: attendanceData.longitude,
        checkInAddress: attendanceData.address,
        officeLocationId: attendanceData.officeLocationId
      },
      ipAddress,
      userAgent,
      reason: 'Employee check-in',
      metadata: {
        attendanceDate: attendanceData.attendanceDate,
        checkInTime: attendanceData.checkInTime,
        workingHoursMinutes: attendanceData.workingHoursMinutes,
        status: attendanceData.status,
        isValidLocation: attendanceData.isValidLocation,
        locationInfo: {
          latitude: attendanceData.latitude,
          longitude: attendanceData.longitude,
          address: attendanceData.address,
          officeLocationId: attendanceData.officeLocationId
        }
      }
    })
  }

  async logCheckOut(
    attendanceId: string,
    userId: string,
    oldData: {
      checkInTime: Date
      workingHoursMinutes: number
    },
    newData: {
      checkOutTime: Date
      workingHoursMinutes: number
      isValidLocation: boolean
      latitude?: number
      longitude?: number
      address?: string
    },
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'CHECK_OUT',
      entityId: attendanceId,
      entityType: 'ATTENDANCE',
      userId,
      performedBy,
      oldValues: {
        checkOutTime: null,
        workingHoursMinutes: oldData.workingHoursMinutes,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutAddress: null
      },
      newValues: {
        checkOutTime: newData.checkOutTime.toISOString(),
        workingHoursMinutes: newData.workingHoursMinutes,
        isValidLocation: newData.isValidLocation,
        checkOutLatitude: newData.latitude,
        checkOutLongitude: newData.longitude,
        checkOutAddress: newData.address
      },
      ipAddress,
      userAgent,
      reason: 'Employee check-out',
      metadata: {
        checkInTime: oldData.checkInTime,
        checkOutTime: newData.checkOutTime,
        workingHoursMinutes: newData.workingHoursMinutes,
        isValidLocation: newData.isValidLocation,
        locationInfo: {
          latitude: newData.latitude,
          longitude: newData.longitude,
          address: newData.address
        }
      }
    })
  }

  async logStatusUpdate(
    attendanceId: string,
    userId: string,
    oldStatus: AttendanceStatus,
    newStatus: AttendanceStatus,
    performedBy: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'UPDATE_STATUS',
      entityId: attendanceId,
      entityType: 'ATTENDANCE',
      userId,
      performedBy,
      oldValues: {
        status: oldStatus,
        workingHoursMinutes: newStatus === AttendanceStatus.ABSENT ? 0 : undefined
      },
      newValues: {
        status: newStatus,
        workingHoursMinutes: newStatus === AttendanceStatus.ABSENT ? 0 : undefined
      },
      ipAddress,
      userAgent,
      reason: reason || 'Attendance status updated',
      metadata: {
        status: newStatus
      }
    })
  }

  async logManualEntry(
    attendanceId: string,
    userId: string,
    attendanceData: {
      attendanceDate: Date
      checkInTime?: Date
      checkOutTime?: Date
      status: AttendanceStatus
      workingHoursMinutes: number
      notes?: string
    },
    performedBy: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'MANUAL_ENTRY',
      entityId: attendanceId,
      entityType: 'ATTENDANCE',
      userId,
      performedBy,
      newValues: {
        attendanceDate: attendanceData.attendanceDate.toISOString(),
        checkInTime: attendanceData.checkInTime?.toISOString(),
        checkOutTime: attendanceData.checkOutTime?.toISOString(),
        status: attendanceData.status,
        workingHoursMinutes: attendanceData.workingHoursMinutes,
        notes: attendanceData.notes
      },
      ipAddress,
      userAgent,
      reason: reason || 'Manual attendance entry by admin',
      metadata: {
        attendanceDate: attendanceData.attendanceDate,
        checkInTime: attendanceData.checkInTime,
        checkOutTime: attendanceData.checkOutTime,
        workingHoursMinutes: attendanceData.workingHoursMinutes,
        status: attendanceData.status
      }
    })
  }
}
