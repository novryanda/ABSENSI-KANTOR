// ============================================================================
// OFFICE LOCATION REPOSITORY INTERFACE
// src/domain/repositories/IOfficeLocationRepository.ts
// ============================================================================

export interface OfficeLocationEntity {
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

export interface CreateOfficeLocationData {
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters?: number
  isActive?: boolean
}

export interface UpdateOfficeLocationData {
  name?: string
  code?: string
  address?: string
  latitude?: number
  longitude?: number
  radiusMeters?: number
  isActive?: boolean
}

export interface OfficeLocationFilters {
  name?: string
  code?: string
  isActive?: boolean
  search?: string
}

export interface IOfficeLocationRepository {
  // Basic CRUD operations
  findById(id: string): Promise<OfficeLocationEntity | null>
  findByCode(code: string): Promise<OfficeLocationEntity | null>
  findByName(name: string): Promise<OfficeLocationEntity | null>
  create(data: CreateOfficeLocationData): Promise<OfficeLocationEntity>
  update(id: string, data: UpdateOfficeLocationData): Promise<OfficeLocationEntity>
  delete(id: string): Promise<void>
  
  // Query operations
  findAll(): Promise<OfficeLocationEntity[]>
  findActive(): Promise<OfficeLocationEntity[]>
  findMany(filters: OfficeLocationFilters, limit?: number, offset?: number): Promise<OfficeLocationEntity[]>
  countMany(filters: OfficeLocationFilters): Promise<number>
  
  // Location validation operations
  findNearbyLocations(latitude: number, longitude: number, radiusMeters?: number): Promise<OfficeLocationEntity[]>
  isLocationWithinRadius(latitude: number, longitude: number, officeLocationId: string): Promise<boolean>
  
  // Validation helpers
  isCodeUnique(code: string, excludeId?: string): Promise<boolean>
  isNameUnique(name: string, excludeId?: string): Promise<boolean>
}
