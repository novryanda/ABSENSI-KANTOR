import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
import { logAuditAction } from '../../infrastructure/database/supabaseClient';
import crypto from 'crypto';

export interface ResetUserPasswordRequest {
  // Target user
  userId: string;
  
  // Password options
  generatePassword?: boolean; // Default: true
  customPassword?: string;
  
  // Admin context
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResetUserPasswordResponse {
  success: boolean;
  temporaryPassword?: string;
  error?: string;
}

export class ResetUserPassword {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: ResetUserPasswordRequest): Promise<ResetUserPasswordResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasPasswordResetPermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Password reset permissions required' };
      }

      // Get target user
      const targetUser = await this.userRepository.findById(request.userId);
      if (!targetUser) {
        return { success: false, error: 'User not found' };
      }

      // Validate custom password if provided
      if (request.customPassword && request.customPassword.length < 8) {
        return { success: false, error: 'Custom password must be at least 8 characters long' };
      }

      // Generate or use custom password
      const newPassword = request.customPassword || this.generateSecurePassword();

      // Create updated user entity with new password
      const updatedUser = new UserEntity(
        targetUser.id,
        targetUser.email,
        targetUser.name,
        targetUser.nip,
        targetUser.phone,
        targetUser.birthDate,
        targetUser.gender,
        targetUser.address,
        targetUser.hireDate,
        targetUser.status,
        targetUser.departmentId,
        targetUser.roleId,
        undefined, // Will be set by setPassword
        targetUser.latitude,
        targetUser.longitude,
        targetUser.lastLogin,
        targetUser.createdAt,
        new Date()
      );

      // Set new password
      await updatedUser.setPassword(newPassword);

      // Save updated user
      await this.userRepository.update(updatedUser);

      // Log password reset
      await this.logPasswordReset(request, targetUser);

      return {
        success: true,
        temporaryPassword: request.generatePassword !== false ? newPassword : undefined
      };

    } catch (error) {
      console.error('Error resetting user password:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reset password' 
      };
    }
  }

  private hasPasswordResetPermissions(roleName?: string): boolean {
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }

  private generateSecurePassword(): string {
    // Generate a secure random password
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  private async logPasswordReset(request: ResetUserPasswordRequest, targetUser: UserEntity): Promise<void> {
    try {
      await logAuditAction({
        userId: request.adminUserId,
        action: 'USER_PASSWORD_RESET_BY_ADMIN',
        tableName: 'users',
        recordId: request.userId,
        oldValues: {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name
        },
        newValues: {
          passwordResetBy: request.adminUserId,
          resetAt: new Date().toISOString(),
          passwordGenerated: request.generatePassword !== false
        },
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });
    } catch (error) {
      console.error('Error logging password reset:', error);
    }
  }
}
