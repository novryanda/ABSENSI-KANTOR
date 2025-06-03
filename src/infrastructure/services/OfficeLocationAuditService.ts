// ============================================================================
// OFFICE LOCATION AUDIT SERVICE
// src/infrastructure/services/OfficeLocationAuditService.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'

export interface OfficeLocationAuditData {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
  entityId: string
  entityType: 'OFFICE_LOCATION'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  performedBy: string
  ipAddress?: string
  userAgent?: string
  reason?: string
}

export class OfficeLocationAuditService {
  constructor(private prisma: PrismaClient) {}

  async logAction(data: OfficeLocationAuditData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.performedBy,
          action: data.action,
          tableName: 'office_locations',
          recordId: data.entityId,
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })
    } catch (error) {
      console.error('Failed to log office location audit:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  async logCreate(
    entityId: string,
    newValues: Record<string, any>,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'CREATE',
      entityId,
      entityType: 'OFFICE_LOCATION',
      newValues,
      performedBy,
      ipAddress,
      userAgent,
      reason: 'Office location created'
    })
  }

  async logUpdate(
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'UPDATE',
      entityId,
      entityType: 'OFFICE_LOCATION',
      oldValues,
      newValues,
      performedBy,
      ipAddress,
      userAgent,
      reason: 'Office location updated'
    })
  }

  async logDelete(
    entityId: string,
    oldValues: Record<string, any>,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'DELETE',
      entityId,
      entityType: 'OFFICE_LOCATION',
      oldValues,
      performedBy,
      ipAddress,
      userAgent,
      reason: 'Office location deleted'
    })
  }

  async logActivate(
    entityId: string,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'ACTIVATE',
      entityId,
      entityType: 'OFFICE_LOCATION',
      newValues: { isActive: true },
      performedBy,
      ipAddress,
      userAgent,
      reason: 'Office location activated'
    })
  }

  async logDeactivate(
    entityId: string,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'DEACTIVATE',
      entityId,
      entityType: 'OFFICE_LOCATION',
      newValues: { isActive: false },
      performedBy,
      ipAddress,
      userAgent,
      reason: 'Office location deactivated'
    })
  }

  async getAuditHistory(
    entityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          recordId: entityId,
          tableName: 'office_locations'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nip: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      })

      return auditLogs
    } catch (error) {
      console.error('Failed to get audit history:', error)
      return []
    }
  }

  async getRecentActivity(
    limit: number = 20
  ): Promise<any[]> {
    try {
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          tableName: 'office_locations'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nip: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      })

      return auditLogs
    } catch (error) {
      console.error('Failed to get recent activity:', error)
      return []
    }
  }
}
