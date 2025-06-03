// ============================================================================
// OFFICE LOCATION REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/OfficeLocationRepository.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'
import { 
  IOfficeLocationRepository,
  OfficeLocationEntity,
  CreateOfficeLocationData,
  UpdateOfficeLocationData,
  OfficeLocationFilters
} from '@/domain/repositories/IOfficeLocationRepository'

export class PrismaOfficeLocationRepository implements IOfficeLocationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<OfficeLocationEntity | null> {
    const location = await this.prisma.officeLocation.findUnique({
      where: { id }
    })
    return location ? this.toDomain(location) : null
  }

  async findByCode(code: string): Promise<OfficeLocationEntity | null> {
    const location = await this.prisma.officeLocation.findUnique({
      where: { code }
    })
    return location ? this.toDomain(location) : null
  }

  async findByName(name: string): Promise<OfficeLocationEntity | null> {
    const location = await this.prisma.officeLocation.findUnique({
      where: { name }
    })
    return location ? this.toDomain(location) : null
  }

  async create(data: CreateOfficeLocationData): Promise<OfficeLocationEntity> {
    const location = await this.prisma.officeLocation.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters || 100,
        isActive: data.isActive ?? true
      }
    })
    return this.toDomain(location)
  }

  async update(id: string, data: UpdateOfficeLocationData): Promise<OfficeLocationEntity> {
    const location = await this.prisma.officeLocation.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.radiusMeters !== undefined && { radiusMeters: data.radiusMeters }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })
    return this.toDomain(location)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.officeLocation.delete({
      where: { id }
    })
  }

  async findAll(): Promise<OfficeLocationEntity[]> {
    const locations = await this.prisma.officeLocation.findMany({
      orderBy: { name: 'asc' }
    })
    return locations.map(this.toDomain)
  }

  async findActive(): Promise<OfficeLocationEntity[]> {
    const locations = await this.prisma.officeLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return locations.map(this.toDomain)
  }

  async findMany(
    filters: OfficeLocationFilters, 
    limit?: number, 
    offset?: number
  ): Promise<OfficeLocationEntity[]> {
    const where: any = {}

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' }
    }

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' }
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const locations = await this.prisma.officeLocation.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(limit && { take: limit }),
      ...(offset && { skip: offset })
    })

    return locations.map(this.toDomain)
  }

  async countMany(filters: OfficeLocationFilters): Promise<number> {
    const where: any = {}

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' }
    }

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' }
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    return await this.prisma.officeLocation.count({ where })
  }

  async findNearbyLocations(
    latitude: number, 
    longitude: number, 
    radiusMeters: number = 1000
  ): Promise<OfficeLocationEntity[]> {
    // Note: This is a simplified implementation
    // In production, you might want to use PostGIS or similar for better performance
    const locations = await this.prisma.officeLocation.findMany({
      where: { isActive: true }
    })

    const nearbyLocations = locations.filter(location => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        Number(location.latitude), 
        Number(location.longitude)
      )
      return distance <= radiusMeters
    })

    return nearbyLocations.map(this.toDomain)
  }

  async isLocationWithinRadius(
    latitude: number, 
    longitude: number, 
    officeLocationId: string
  ): Promise<boolean> {
    const location = await this.findById(officeLocationId)
    if (!location) return false

    const distance = this.calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    )

    return distance <= location.radiusMeters
  }

  async isCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.officeLocation.findUnique({
      where: { code }
    })

    if (!existing) return true
    if (excludeId && existing.id === excludeId) return true
    return false
  }

  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.officeLocation.findUnique({
      where: { name }
    })

    if (!existing) return true
    if (excludeId && existing.id === excludeId) return true
    return false
  }

  // Helper methods
  private toDomain(location: any): OfficeLocationEntity {
    return {
      id: location.id,
      name: location.name,
      code: location.code,
      address: location.address,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      radiusMeters: location.radiusMeters,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }
}
