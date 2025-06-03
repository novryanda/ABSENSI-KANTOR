// ============================================================================
// CREATE OFFICE LOCATION USE CASE
// src/use-cases/office-location/CreateOfficeLocation.ts
// ============================================================================

import { IOfficeLocationRepository, CreateOfficeLocationData } from '@/domain/repositories/IOfficeLocationRepository'
import { ILocationValidationService } from '@/domain/services/ILocationValidationService'
import { OfficeLocationAuditService } from '@/infrastructure/services/OfficeLocationAuditService'

export interface CreateOfficeLocationRequest {
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters?: number
  isActive?: boolean
  adminUserId: string
  ipAddress?: string
  userAgent?: string
}

export interface CreateOfficeLocationResponse {
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

export class CreateOfficeLocation {
  constructor(
    private officeLocationRepository: IOfficeLocationRepository,
    private locationValidationService: ILocationValidationService,
    private auditService: OfficeLocationAuditService
  ) {}

  async execute(request: CreateOfficeLocationRequest): Promise<CreateOfficeLocationResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Validate coordinates format
      if (!this.locationValidationService.validateCoordinateFormat(request.latitude, request.longitude)) {
        return {
          success: false,
          error: 'Format koordinat tidak valid'
        }
      }

      // Check if code is unique
      const isCodeUnique = await this.officeLocationRepository.isCodeUnique(request.code)
      if (!isCodeUnique) {
        return {
          success: false,
          error: 'Kode lokasi sudah digunakan'
        }
      }

      // Check if name is unique
      const isNameUnique = await this.officeLocationRepository.isNameUnique(request.name)
      if (!isNameUnique) {
        return {
          success: false,
          error: 'Nama lokasi sudah digunakan'
        }
      }

      // Create office location data
      const createData: CreateOfficeLocationData = {
        name: request.name.trim(),
        code: request.code.trim().toUpperCase(),
        address: request.address?.trim(),
        latitude: request.latitude,
        longitude: request.longitude,
        radiusMeters: request.radiusMeters || 100,
        isActive: request.isActive ?? true
      }

      // Create the office location
      const officeLocation = await this.officeLocationRepository.create(createData)

      // Log audit trail
      await this.auditService.logCreate(
        officeLocation.id,
        {
          name: officeLocation.name,
          code: officeLocation.code,
          address: officeLocation.address,
          latitude: officeLocation.latitude,
          longitude: officeLocation.longitude,
          radiusMeters: officeLocation.radiusMeters,
          isActive: officeLocation.isActive
        },
        request.adminUserId,
        request.ipAddress,
        request.userAgent
      )

      return {
        success: true,
        data: {
          id: officeLocation.id,
          name: officeLocation.name,
          code: officeLocation.code,
          address: officeLocation.address,
          latitude: officeLocation.latitude,
          longitude: officeLocation.longitude,
          radiusMeters: officeLocation.radiusMeters,
          isActive: officeLocation.isActive,
          createdAt: officeLocation.createdAt,
          updatedAt: officeLocation.updatedAt
        }
      }
    } catch (error) {
      console.error('Error creating office location:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat membuat lokasi kantor'
      }
    }
  }

  private validateInput(request: CreateOfficeLocationRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.name || request.name.trim().length === 0) {
      return { isValid: false, error: 'Nama lokasi wajib diisi' }
    }

    if (!request.code || request.code.trim().length === 0) {
      return { isValid: false, error: 'Kode lokasi wajib diisi' }
    }

    if (!request.adminUserId || request.adminUserId.trim().length === 0) {
      return { isValid: false, error: 'Admin user ID wajib diisi' }
    }

    // Validate name length
    if (request.name.trim().length > 100) {
      return { isValid: false, error: 'Nama lokasi maksimal 100 karakter' }
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9_-]+$/
    if (!codeRegex.test(request.code.trim().toUpperCase())) {
      return { isValid: false, error: 'Kode lokasi hanya boleh mengandung huruf besar, angka, underscore, dan dash' }
    }

    if (request.code.trim().length > 20) {
      return { isValid: false, error: 'Kode lokasi maksimal 20 karakter' }
    }

    // Validate coordinates
    if (typeof request.latitude !== 'number' || typeof request.longitude !== 'number') {
      return { isValid: false, error: 'Koordinat harus berupa angka' }
    }

    // Validate radius
    if (request.radiusMeters !== undefined) {
      if (typeof request.radiusMeters !== 'number' || request.radiusMeters < 10 || request.radiusMeters > 1000) {
        return { isValid: false, error: 'Radius harus antara 10-1000 meter' }
      }
    }

    // Validate address length
    if (request.address && request.address.trim().length > 500) {
      return { isValid: false, error: 'Alamat maksimal 500 karakter' }
    }

    return { isValid: true }
  }
}
