import { UserEntity } from '../entities/User';
import { UserStatus } from '@prisma/client';

export interface UserWithRelations {
  id: string;
  email: string;
  name?: string;
  nip?: string;
  phone?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  role?: {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface UserFilters {
  status?: UserStatus;
  roleId?: string;
  departmentId?: string;
  search?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByNIP(nip: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  findWithRoleAndDepartment(id: string): Promise<UserEntity & {
    role?: { id: string; name: string; permissions: Record<string, boolean> };
    department?: { id: string; name: string; code: string };
  } | null>;

  // Admin management methods
  findAllWithRelations(): Promise<UserWithRelations[]>;
  findManyWithRelations(filters: UserFilters, limit?: number, offset?: number): Promise<UserWithRelations[]>;
  countMany(filters: UserFilters): Promise<number>;
  findByDepartment(departmentId: string): Promise<UserWithRelations[]>;
  findByRole(roleId: string): Promise<UserWithRelations[]>;
}
