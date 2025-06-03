// ============================================================================
// OFFICE LOCATION DTOs
// src/types/office-location.dto.ts
// ============================================================================

// Request DTOs
export interface CreateOfficeLocationDto {
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters?: number
  isActive?: boolean
}

export interface UpdateOfficeLocationDto {
  name?: string
  code?: string
  address?: string
  latitude?: number
  longitude?: number
  radiusMeters?: number
  isActive?: boolean
}

export interface OfficeLocationFiltersDto {
  name?: string
  code?: string
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

// Response DTOs
export interface OfficeLocationDto {
  id: string
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OfficeLocationListDto {
  locations: OfficeLocationDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Location validation DTOs
export interface LocationValidationDto {
  latitude: number
  longitude: number
  officeLocationId?: string
}

export interface LocationValidationResultDto {
  isValid: boolean
  nearestOfficeLocation?: {
    id: string
    name: string
    code: string
    distance: number
  }
  distance?: number
  allowedRadius?: number
  errorMessage?: string
}

// Audit DTOs
export interface OfficeLocationAuditDto {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
  entityId: string
  entityType: 'OFFICE_LOCATION'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  performedBy: string
  performedAt: string
  ipAddress?: string
  userAgent?: string
  reason?: string
}

// Map integration DTOs (for future map integration)
export interface MapCoordinateDto {
  latitude: number
  longitude: number
  address?: string
}

export interface OfficeLocationMapDto extends OfficeLocationDto {
  coordinates: MapCoordinateDto
  isWithinRadius?: boolean
  distanceFromUser?: number
}
