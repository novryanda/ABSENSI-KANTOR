import { PrismaClient } from '@prisma/client';
import { IRoleRepository, RoleEntity, CreateRoleData, UpdateRoleData, RoleFilters } from '../../../domain/repositories/IRoleRepository';

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { id }
    });
    return role ? this.toDomain(role) : null;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { name }
    });
    return role ? this.toDomain(role) : null;
  }

  async create(data: CreateRoleData): Promise<RoleEntity> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
        isActive: data.isActive ?? true,
      }
    });
    return this.toDomain(role);
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleEntity> {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isActive: data.isActive,
        updatedAt: new Date(),
      }
    });
    return this.toDomain(role);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id }
    });
  }

  async findAll(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    return roles.map(role => this.toDomain(role));
  }

  async findActive(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return roles.map(role => this.toDomain(role));
  }

  async findMany(filters: RoleFilters, limit?: number, offset?: number): Promise<RoleEntity[]> {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const roles = await this.prisma.role.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset
    });

    return roles.map(role => this.toDomain(role));
  }

  async countMany(filters: RoleFilters): Promise<number> {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return await this.prisma.role.count({ where });
  }

  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const role = await this.findById(roleId);
    if (!role) return false;
    return role.permissions[permission] === true;
  }

  async updatePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RoleEntity> {
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions,
        updatedAt: new Date(),
      }
    });
    return this.toDomain(role);
  }

  private toDomain(role: any): RoleEntity {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as Record<string, boolean>,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
