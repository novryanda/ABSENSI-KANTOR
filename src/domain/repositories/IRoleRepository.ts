import { Role } from '@prisma/client';

export interface RoleEntity {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface RoleFilters {
  isActive?: boolean;
  search?: string;
}

export interface IRoleRepository {
  // Basic CRUD operations
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  create(data: CreateRoleData): Promise<RoleEntity>;
  update(id: string, data: UpdateRoleData): Promise<RoleEntity>;
  delete(id: string): Promise<void>;

  // Query operations
  findAll(): Promise<RoleEntity[]>;
  findActive(): Promise<RoleEntity[]>;
  findMany(filters: RoleFilters, limit?: number, offset?: number): Promise<RoleEntity[]>;
  countMany(filters: RoleFilters): Promise<number>;

  // Permission operations
  hasPermission(roleId: string, permission: string): Promise<boolean>;
  updatePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RoleEntity>;
}
