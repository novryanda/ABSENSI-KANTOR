// ============================================================================
// GET OFFICE LOCATION BY ID USE CASE
// src/use-cases/office-location/GetOfficeLocationById.ts
// ============================================================================

import { IOfficeLocationRepository } from '@/domain/repositories/IOfficeLocationRepository'

export interface GetOfficeLocationByIdRequest {
  id: string
  adminUserId: string
}

export interface GetOfficeLocationByIdResponse {
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

export class GetOfficeLocationById {
  constructor(private officeLocationRepository: IOfficeLocationRepository) {}

  async execute(request: GetOfficeLocationByIdRequest): Promise<GetOfficeLocationByIdResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Get office location by ID
      const location = await this.officeLocationRepository.findById(request.id)

      if (!location) {
        return {
          success: false,
          error: 'Lokasi kantor tidak ditemukan'
        }
      }

      return {
        success: true,
        data: {
          id: location.id,
          name: location.name,
          code: location.code,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: location.radiusMeters,
          isActive: location.isActive,
          createdAt: location.createdAt,
          updatedAt: location.updatedAt
        }
      }
    } catch (error) {
      console.error('Error getting office location by ID:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data lokasi kantor'
      }
    }
  }

  private validateInput(request: GetOfficeLocationByIdRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.id || request.id.trim().length === 0) {
      return { isValid: false, error: 'ID lokasi wajib diisi' }
    }

    if (!request.adminUserId || request.adminUserId.trim().length === 0) {
      return { isValid: false, error: 'Admin user ID wajib diisi' }
    }

    return { isValid: true }
  }
}
