// ============================================================================
// UPDATE OFFICE LOCATION USE CASE
// src/use-cases/office-location/UpdateOfficeLocation.ts
// ============================================================================

import { IOfficeLocationRepository, UpdateOfficeLocationData } from '@/domain/repositories/IOfficeLocationRepository'
import { ILocationValidationService } from '@/domain/services/ILocationValidationService'
import { OfficeLocationAuditService } from '@/infrastructure/services/OfficeLocationAuditService'

export interface UpdateOfficeLocationRequest {
  id: string
  name?: string
  code?: string
  address?: string
  latitude?: number
  longitude?: number
  radiusMeters?: number
  isActive?: boolean
  adminUserId: string
  ipAddress?: string
  userAgent?: string
}

export interface UpdateOfficeLocationResponse {
  success: boolean
  data?: {
    id: string
    name: string
    code: string
    address?: string
    latitude: number
    longitude: number
    radiusMeters: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}

export class UpdateOfficeLocation {
  constructor(
    private officeLocationRepository: IOfficeLocationRepository,
    private locationValidationService: ILocationValidationService,
    private auditService: OfficeLocationAuditService
  ) {}

  async execute(request: UpdateOfficeLocationRequest): Promise<UpdateOfficeLocationResponse> {
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

      // Validate coordinates format if provided
      if (request.latitude !== undefined && request.longitude !== undefined) {
        if (!this.locationValidationService.validateCoordinateFormat(request.latitude, request.longitude)) {
          return {
            success: false,
            error: 'Format koordinat tidak valid'
          }
        }
      }

      // Check if code is unique (if being updated)
      if (request.code && request.code !== existingLocation.code) {
        const isCodeUnique = await this.officeLocationRepository.isCodeUnique(request.code, request.id)
        if (!isCodeUnique) {
          return {
            success: false,
            error: 'Kode lokasi sudah digunakan'
          }
        }
      }

      // Check if name is unique (if being updated)
      if (request.name && request.name !== existingLocation.name) {
        const isNameUnique = await this.officeLocationRepository.isNameUnique(request.name, request.id)
        if (!isNameUnique) {
          return {
            success: false,
            error: 'Nama lokasi sudah digunakan'
          }
        }
      }

      // Prepare update data
      const updateData: UpdateOfficeLocationData = {}
      
      if (request.name !== undefined) {
        updateData.name = request.name.trim()
      }
      
      if (request.code !== undefined) {
        updateData.code = request.code.trim().toUpperCase()
      }
      
      if (request.address !== undefined) {
        updateData.address = request.address.trim() || null
      }
      
      if (request.latitude !== undefined) {
        updateData.latitude = request.latitude
      }
      
      if (request.longitude !== undefined) {
        updateData.longitude = request.longitude
      }
      
      if (request.radiusMeters !== undefined) {
        updateData.radiusMeters = request.radiusMeters
      }
      
      if (request.isActive !== undefined) {
        updateData.isActive = request.isActive
      }

      // Store old values for audit
      const oldValues = {
        name: existingLocation.name,
        code: existingLocation.code,
        address: existingLocation.address,
        latitude: existingLocation.latitude,
        longitude: existingLocation.longitude,
        radiusMeters: existingLocation.radiusMeters,
        isActive: existingLocation.isActive
      }

      // Update the office location
      const updatedLocation = await this.officeLocationRepository.update(request.id, updateData)

      // Prepare new values for audit
      const newValues = {
        name: updatedLocation.name,
        code: updatedLocation.code,
        address: updatedLocation.address,
        latitude: updatedLocation.latitude,
        longitude: updatedLocation.longitude,
        radiusMeters: updatedLocation.radiusMeters,
        isActive: updatedLocation.isActive
      }

      // Log audit trail
      await this.auditService.logUpdate(
        updatedLocation.id,
        oldValues,
        newValues,
        request.adminUserId,
        request.ipAddress,
        request.userAgent
      )

      return {
        success: true,
        data: {
          id: updatedLocation.id,
          name: updatedLocation.name,
          code: updatedLocation.code,
          address: updatedLocation.address,
          latitude: updatedLocation.latitude,
          longitude: updatedLocation.longitude,
          radiusMeters: updatedLocation.radiusMeters,
          isActive: updatedLocation.isActive,
          createdAt: updatedLocation.createdAt,
          updatedAt: updatedLocation.updatedAt
        }
      }
    } catch (error) {
      console.error('Error updating office location:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengupdate lokasi kantor'
      }
    }
  }

  private validateInput(request: UpdateOfficeLocationRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.id || request.id.trim().length === 0) {
      return { isValid: false, error: 'ID lokasi wajib diisi' }
    }

    if (!request.adminUserId || request.adminUserId.trim().length === 0) {
      return { isValid: false, error: 'Admin user ID wajib diisi' }
    }

    // Validate name length if provided
    if (request.name !== undefined) {
      if (request.name.trim().length === 0) {
        return { isValid: false, error: 'Nama lokasi tidak boleh kosong' }
      }
      if (request.name.trim().length > 100) {
        return { isValid: false, error: 'Nama lokasi maksimal 100 karakter' }
      }
    }

    // Validate code format if provided
    if (request.code !== undefined) {
      if (request.code.trim().length === 0) {
        return { isValid: false, error: 'Kode lokasi tidak boleh kosong' }
      }
      
      const codeRegex = /^[A-Z0-9_-]+$/
      if (!codeRegex.test(request.code.trim().toUpperCase())) {
        return { isValid: false, error: 'Kode lokasi hanya boleh mengandung huruf besar, angka, underscore, dan dash' }
      }

      if (request.code.trim().length > 20) {
        return { isValid: false, error: 'Kode lokasi maksimal 20 karakter' }
      }
    }

    // Validate coordinates if provided
    if (request.latitude !== undefined && typeof request.latitude !== 'number') {
      return { isValid: false, error: 'Latitude harus berupa angka' }
    }

    if (request.longitude !== undefined && typeof request.longitude !== 'number') {
      return { isValid: false, error: 'Longitude harus berupa angka' }
    }

    // Validate radius if provided
    if (request.radiusMeters !== undefined) {
      if (typeof request.radiusMeters !== 'number' || request.radiusMeters < 10 || request.radiusMeters > 1000) {
        return { isValid: false, error: 'Radius harus antara 10-1000 meter' }
      }
    }

    // Validate address length if provided
    if (request.address !== undefined && request.address.trim().length > 500) {
      return { isValid: false, error: 'Alamat maksimal 500 karakter' }
    }

    return { isValid: true }
  }
}
