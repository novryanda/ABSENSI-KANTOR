import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';
import { UserEntity } from '../../domain/entities/User';
import { UserStatus, Gender } from '@prisma/client';
import { logAuditAction } from '../../infrastructure/database/supabaseClient';

export interface UpdateUserByAdminRequest {
  // Target user
  userId: string;
  
  // Updatable fields
  name?: string;
  email?: string;
  nip?: string;
  phone?: string;
  birthDate?: Date;
  gender?: Gender;
  address?: string;
  hireDate?: Date;
  departmentId?: string;
  roleId?: string;
  status?: UserStatus;
  
  // Admin context
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateUserByAdminResponse {
  success: boolean;
  user?: UserEntity;
  error?: string;
}

export class UpdateUserByAdmin {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private departmentRepository: IDepartmentRepository
  ) {}

  async execute(request: UpdateUserByAdminRequest): Promise<UpdateUserByAdminResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasAdminPermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Admin permissions required' };
      }

      // Get existing user
      const existingUser = await this.userRepository.findById(request.userId);
      if (!existingUser) {
        return { success: false, error: 'User not found' };
      }

      // Prevent self-modification of critical fields for security
      if (request.userId === request.adminUserId) {
        if (request.roleId && request.roleId !== existingUser.roleId) {
          return { success: false, error: 'Cannot modify your own role' };
        }
        if (request.status && request.status !== existingUser.status) {
          return { success: false, error: 'Cannot modify your own status' };
        }
      }

      // Validate input data
      const validationError = await this.validateInput(request, existingUser);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Check for conflicts with other users
      const conflictError = await this.checkConflicts(request, existingUser);
      if (conflictError) {
        return { success: false, error: conflictError };
      }

      // Validate role and department if provided
      if (request.roleId && request.roleId !== existingUser.roleId) {
        const role = await this.roleRepository.findById(request.roleId);
        if (!role || !role.isActive) {
          return { success: false, error: 'Invalid or inactive role selected' };
        }
      }

      if (request.departmentId && request.departmentId !== existingUser.departmentId) {
        const department = await this.departmentRepository.findById(request.departmentId);
        if (!department || !department.isActive) {
          return { success: false, error: 'Invalid or inactive department selected' };
        }
      }

      // Store old values for audit
      const oldValues = {
        name: existingUser.name,
        email: existingUser.email,
        nip: existingUser.nip,
        phone: existingUser.phone,
        birthDate: existingUser.birthDate,
        gender: existingUser.gender,
        address: existingUser.address,
        hireDate: existingUser.hireDate,
        departmentId: existingUser.departmentId,
        roleId: existingUser.roleId,
        status: existingUser.status
      };

      // Update user entity
      const updatedUser = new UserEntity(
        existingUser.id,
        request.email ?? existingUser.email,
        request.name ?? existingUser.name,
        request.nip ?? existingUser.nip,
        request.phone ?? existingUser.phone,
        request.birthDate ?? existingUser.birthDate,
        request.gender ?? existingUser.gender,
        request.address ?? existingUser.address,
        request.hireDate ?? existingUser.hireDate,
        request.status ?? existingUser.status,
        request.departmentId ?? existingUser.departmentId,
        request.roleId ?? existingUser.roleId,
        existingUser.passwordHash, // Keep existing password
        existingUser.latitude,
        existingUser.longitude,
        existingUser.lastLogin,
        existingUser.createdAt,
        new Date() // Update timestamp
      );

      // Save updated user
      const savedUser = await this.userRepository.update(updatedUser);

      // Prepare new values for audit
      const newValues = {
        name: savedUser.name,
        email: savedUser.email,
        nip: savedUser.nip,
        phone: savedUser.phone,
        birthDate: savedUser.birthDate,
        gender: savedUser.gender,
        address: savedUser.address,
        hireDate: savedUser.hireDate,
        departmentId: savedUser.departmentId,
        roleId: savedUser.roleId,
        status: savedUser.status
      };

      // Log audit action
      await this.logUserUpdate(request, oldValues, newValues);

      return {
        success: true,
        user: savedUser
      };

    } catch (error) {
      console.error('Error updating user by admin:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      };
    }
  }

  private hasAdminPermissions(roleName?: string): boolean {
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }

  private async validateInput(request: UpdateUserByAdminRequest, existingUser: UserEntity): Promise<string | null> {
    // Validate email format if provided
    if (request.email && !UserEntity.validateEmail(request.email)) {
      return 'Invalid email format';
    }

    // Validate NIP format if provided
    if (request.nip && !UserEntity.validateNIP(request.nip)) {
      return 'Invalid NIP format (must be 18 digits)';
    }

    // Validate phone if provided
    if (request.phone && !UserEntity.validatePhone(request.phone)) {
      return 'Invalid phone format';
    }

    // Validate name if provided
    if (request.name !== undefined && !request.name?.trim()) {
      return 'Name cannot be empty';
    }

    return null;
  }

  private async checkConflicts(request: UpdateUserByAdminRequest, existingUser: UserEntity): Promise<string | null> {
    // Check email conflict
    if (request.email && request.email !== existingUser.email) {
      const existingEmail = await this.userRepository.findByEmail(request.email);
      if (existingEmail && existingEmail.id !== existingUser.id) {
        return 'User with this email already exists';
      }
    }

    // Check NIP conflict
    if (request.nip && request.nip !== existingUser.nip) {
      const existingNIP = await this.userRepository.findByNIP(request.nip);
      if (existingNIP && existingNIP.id !== existingUser.id) {
        return 'User with this NIP already exists';
      }
    }

    // Check phone conflict
    if (request.phone && request.phone !== existingUser.phone) {
      const existingPhone = await this.userRepository.findByPhone(request.phone);
      if (existingPhone && existingPhone.id !== existingUser.id) {
        return 'User with this phone number already exists';
      }
    }

    return null;
  }

  private async logUserUpdate(
    request: UpdateUserByAdminRequest, 
    oldValues: any, 
    newValues: any
  ): Promise<void> {
    try {
      await logAuditAction({
        userId: request.adminUserId,
        action: 'USER_UPDATED_BY_ADMIN',
        tableName: 'users',
        recordId: request.userId,
        oldValues,
        newValues,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });
    } catch (error) {
      console.error('Error logging user update:', error);
    }
  }
}
