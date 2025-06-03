// ============================================================================
// GET OFFICE LOCATIONS USE CASE
// src/use-cases/office-location/GetOfficeLocations.ts
// ============================================================================

import { IOfficeLocationRepository, OfficeLocationFilters } from '@/domain/repositories/IOfficeLocationRepository'

export interface GetOfficeLocationsRequest {
  filters?: {
    name?: string
    code?: string
    isActive?: boolean
    search?: string
  }
  pagination?: {
    page?: number
    limit?: number
  }
  adminUserId: string
}

export interface GetOfficeLocationsResponse {
  success: boolean
  data?: {
    locations: Array<{
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
    }>
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
  error?: string
}

export class GetOfficeLocations {
  constructor(private officeLocationRepository: IOfficeLocationRepository) {}

  async execute(request: GetOfficeLocationsRequest): Promise<GetOfficeLocationsResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Set default pagination
      const page = request.pagination?.page || 1
      const limit = request.pagination?.limit || 10
      const offset = (page - 1) * limit

      // Prepare filters
      const filters: OfficeLocationFilters = {
        ...(request.filters?.name && { name: request.filters.name }),
        ...(request.filters?.code && { code: request.filters.code }),
        ...(request.filters?.isActive !== undefined && { isActive: request.filters.isActive }),
        ...(request.filters?.search && { search: request.filters.search })
      }

      // Get locations and total count
      const [locations, total] = await Promise.all([
        this.officeLocationRepository.findMany(filters, limit, offset),
        this.officeLocationRepository.countMany(filters)
      ])

      // Calculate total pages
      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          locations: locations.map(location => ({
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
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        }
      }
    } catch (error) {
      console.error('Error getting office locations:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data lokasi kantor'
      }
    }
  }

  private validateInput(request: GetOfficeLocationsRequest): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!request.adminUserId || request.adminUserId.trim().length === 0) {
      return { isValid: false, error: 'Admin user ID wajib diisi' }
    }

    // Validate pagination
    if (request.pagination?.page !== undefined) {
      if (typeof request.pagination.page !== 'number' || request.pagination.page < 1) {
        return { isValid: false, error: 'Page harus berupa angka positif' }
      }
    }

    if (request.pagination?.limit !== undefined) {
      if (typeof request.pagination.limit !== 'number' || request.pagination.limit < 1 || request.pagination.limit > 100) {
        return { isValid: false, error: 'Limit harus antara 1-100' }
      }
    }

    return { isValid: true }
  }
}
