import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
import { UserStatus } from '@prisma/client';
import { logAuditAction } from '../../infrastructure/database/supabaseClient';

export interface DeleteUserByAdminRequest {
  // Target user
  userId: string;
  
  // Delete options
  softDelete?: boolean; // Default: true (mark as inactive)
  reason?: string;
  
  // Admin context
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DeleteUserByAdminResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class DeleteUserByAdmin {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: DeleteUserByAdminRequest): Promise<DeleteUserByAdminResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasDeletePermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Delete permissions required' };
      }

      // Get target user
      const targetUser = await this.userRepository.findById(request.userId);
      if (!targetUser) {
        return { success: false, error: 'User not found' };
      }

      // Prevent self-deletion
      if (request.userId === request.adminUserId) {
        return { success: false, error: 'Cannot delete your own account' };
      }

      // Prevent deletion of other Super Admins (unless requester is Super Admin)
      if (targetUser.roleId) {
        const targetUserWithRole = await this.userRepository.findWithRoleAndDepartment(request.userId);
        if (targetUserWithRole?.role?.name === 'Super Admin' && adminUser.role?.name !== 'Super Admin') {
          return { success: false, error: 'Only Super Admin can delete other Super Admin accounts' };
        }
      }

      // Check for dependencies (this is a business rule check)
      const dependencyCheck = await this.checkUserDependencies(request.userId);
      if (dependencyCheck.hasActiveDependencies && !request.softDelete) {
        return { 
          success: false, 
          error: `Cannot hard delete user: ${dependencyCheck.reason}. Consider soft delete instead.` 
        };
      }

      // Store user data for audit
      const userDataForAudit = {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        nip: targetUser.nip,
        phone: targetUser.phone,
        status: targetUser.status,
        roleId: targetUser.roleId,
        departmentId: targetUser.departmentId,
        deleteReason: request.reason
      };

      let message: string;

      if (request.softDelete !== false) {
        // Soft delete: Mark as inactive
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
          UserStatus.INACTIVE, // Mark as inactive
          targetUser.departmentId,
          targetUser.roleId,
          targetUser.passwordHash,
          targetUser.latitude,
          targetUser.longitude,
          targetUser.lastLogin,
          targetUser.createdAt,
          new Date() // Update timestamp
        );

        await this.userRepository.update(updatedUser);
        message = 'User deactivated successfully';

        // Log soft delete
        await this.logUserDeletion(request, userDataForAudit, 'SOFT_DELETE');
      } else {
        // Hard delete: Remove from database
        await this.userRepository.delete(request.userId);
        message = 'User permanently deleted';

        // Log hard delete
        await this.logUserDeletion(request, userDataForAudit, 'HARD_DELETE');
      }

      return {
        success: true,
        message
      };

    } catch (error) {
      console.error('Error deleting user by admin:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      };
    }
  }

  private hasDeletePermissions(roleName?: string): boolean {
    // Only Super Admin can hard delete, Admin and HR Admin can soft delete
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }

  private async checkUserDependencies(userId: string): Promise<{
    hasActiveDependencies: boolean;
    reason?: string;
  }> {
    try {
      // This is where you would check for:
      // - Active attendance records
      // - Pending requests/approvals
      // - Assigned tasks or responsibilities
      // - Historical data that should be preserved
      
      // For now, we'll implement basic checks
      // In a real application, you'd query related tables
      
      // Example checks (you would implement these based on your schema):
      // const activeAttendance = await this.attendanceRepository.findActiveByUserId(userId);
      // const pendingRequests = await this.requestRepository.findPendingByUserId(userId);
      // const pendingApprovals = await this.requestRepository.findPendingApprovalsByUserId(userId);
      
      // For demonstration, we'll assume users with certain roles have dependencies
      const user = await this.userRepository.findWithRoleAndDepartment(userId);
      
      if (user?.role?.name === 'Super Admin') {
        return {
          hasActiveDependencies: true,
          reason: 'Super Admin accounts have system dependencies'
        };
      }

      // In a real implementation, you would check:
      // if (activeAttendance.length > 0 || pendingRequests.length > 0 || pendingApprovals.length > 0) {
      //   return {
      //     hasActiveDependencies: true,
      //     reason: 'User has active attendance records, pending requests, or pending approvals'
      //   };
      // }

      return { hasActiveDependencies: false };
    } catch (error) {
      console.error('Error checking user dependencies:', error);
      return {
        hasActiveDependencies: true,
        reason: 'Unable to verify user dependencies'
      };
    }
  }

  private async logUserDeletion(
    request: DeleteUserByAdminRequest,
    userData: any,
    deleteType: 'SOFT_DELETE' | 'HARD_DELETE'
  ): Promise<void> {
    try {
      await logAuditAction({
        userId: request.adminUserId,
        action: `USER_${deleteType}_BY_ADMIN`,
        tableName: 'users',
        recordId: request.userId,
        oldValues: userData,
        newValues: {
          deletedBy: request.adminUserId,
          deleteType,
          reason: request.reason,
          deletedAt: new Date().toISOString()
        },
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });
    } catch (error) {
      console.error('Error logging user deletion:', error);
    }
  }
}

// Additional use case for user status toggle
export interface ToggleUserStatusRequest {
  userId: string;
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ToggleUserStatusResponse {
  success: boolean;
  newStatus?: UserStatus;
  error?: string;
}

export class ToggleUserStatus {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: ToggleUserStatusRequest): Promise<ToggleUserStatusResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasStatusTogglePermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Status toggle permissions required' };
      }

      // Get target user
      const targetUser = await this.userRepository.findById(request.userId);
      if (!targetUser) {
        return { success: false, error: 'User not found' };
      }

      // Prevent self-status change
      if (request.userId === request.adminUserId) {
        return { success: false, error: 'Cannot change your own status' };
      }

      // Toggle status
      const newStatus = targetUser.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

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
        newStatus,
        targetUser.departmentId,
        targetUser.roleId,
        targetUser.passwordHash,
        targetUser.latitude,
        targetUser.longitude,
        targetUser.lastLogin,
        targetUser.createdAt,
        new Date()
      );

      await this.userRepository.update(updatedUser);

      // Log status change
      await logAuditAction({
        userId: request.adminUserId,
        action: 'USER_STATUS_TOGGLED_BY_ADMIN',
        tableName: 'users',
        recordId: request.userId,
        oldValues: { status: targetUser.status },
        newValues: { status: newStatus },
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      return {
        success: true,
        newStatus
      };

    } catch (error) {
      console.error('Error toggling user status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle user status' 
      };
    }
  }

  private hasStatusTogglePermissions(roleName?: string): boolean {
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }
}
