import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Permission, UserPermissions } from '../../types/auth';

export class GetUserPermissionsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserPermissions> {
    const user = await this.userRepository.findWithRoleAndDepartment(userId);
    
    if (!user || !user.role) {
      return {}; // No permissions if no role
    }

    return user.role.permissions;
  }

  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const permissions = await this.execute(userId);
    return permissions[permission] === true;
  }

  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.execute(userId);
    return permissions.some(permission => userPermissions[permission] === true);
  }

  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.execute(userId);
    return permissions.every(permission => userPermissions[permission] === true);
  }
}
