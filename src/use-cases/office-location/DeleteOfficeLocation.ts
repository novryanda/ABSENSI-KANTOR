// ============================================================================
// DELETE OFFICE LOCATION USE CASE
// src/use-cases/office-location/DeleteOfficeLocation.ts
// ============================================================================

import { IOfficeLocationRepository } from '@/domain/repositories/IOfficeLocationRepository'
import { OfficeLocationAuditService } from '@/infrastructure/services/OfficeLocationAuditService'

export interface DeleteOfficeLocationRequest {
  id: string
  adminUserId: string
  ipAddress?: string
  userAgent?: string
  reason?: string
}

export interface DeleteOfficeLocationResponse {
  success: boolean
  error?: string
}

export class DeleteOfficeLocation {
  constructor(
    private officeLocationRepository: IOfficeLocationRepository,
    private auditService: OfficeLocationAuditService
  ) {}

  async execute(request: DeleteOfficeLocationRequest): Promise<DeleteOfficeLocationResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Check if office location exists
      const existingLocation = await this.officeLocationRepository.findById(request.id)
      if (!existingLocation) {
        return {
          success: false,
          error: 'Lokasi kantor tidak ditemukan'
        }
      }

      // Check if location can be deleted (business rules)
      const canDelete = await this.checkDeletionConstraints(request.id)
      if (!canDelete.allowed) {
        return {
          success: false,
          error: canDelete.reason
        }
      }

      // Store old values for audit before deletion
      const oldValues = {
        name: existingLocation.name,
        code: existingLocation.code,
        address: existingLocation.address,
        latitude: existingLocation.latitude,
        longitude: existingLocation.longitude,
        radiusMeters: existingLocation.radiusMeters,
        isActive: existingLocation.isActive
      }

      // Delete the office location
      await this.officeLocationRepository.delete(request.id)

      // Log audit trail
      await this.auditService.logDelete(
        request.id,
        oldValues,
        request.adminUserId,
        request.ipAddress,
        request.userAgent
      )

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting office location:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat menghapus lokasi kantor'
      }
    }
  }

  private validateInput(request: DeleteOfficeLocationRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.id || request.id.trim().length === 0) {
      return { isValid: false, error: 'ID lokasi wajib diisi' }
    }

    if (!request.adminUserId || request.adminUserId.trim().length === 0) {
      return { isValid: false, error: 'Admin user ID wajib diisi' }
    }

    return { isValid: true }
  }

  private async checkDeletionConstraints(locationId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check if there are active attendances using this location
      // This would require access to attendance repository
      // For now, we'll implement basic checks

      // Get all active locations to ensure we don't delete the last one
      const activeLocations = await this.officeLocationRepository.findActive()
      const currentLocation = activeLocations.find(loc => loc.id === locationId)
      
      if (currentLocation && currentLocation.isActive && activeLocations.length === 1) {
        return {
          allowed: false,
          reason: 'Tidak dapat menghapus lokasi kantor terakhir yang aktif'
        }
      }

      // Additional business rules can be added here:
      // - Check for recent attendance records
      // - Check for work schedules using this location
      // - Check for pending requests related to this location

      return { allowed: true }
    } catch (error) {
      console.error('Error checking deletion constraints:', error)
      return {
        allowed: false,
        reason: 'Tidak dapat memverifikasi apakah lokasi dapat dihapus'
      }
    }
  }
}
