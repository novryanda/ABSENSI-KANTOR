import { IRoleRepository, RoleEntity } from '../../domain/repositories/IRoleRepository';
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface GetRolesAndDepartmentsRequest {
  adminUserId: string;
}

export interface GetRolesAndDepartmentsResponse {
  success: boolean;
  data?: {
    roles: RoleEntity[];
    departments: Array<{
      id: string;
      name: string;
      code: string;
      description?: string;
      isActive: boolean;
    }>;
  };
  error?: string;
}

export class GetRolesAndDepartments {
  constructor(
    private roleRepository: IRoleRepository,
    private departmentRepository: IDepartmentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: GetRolesAndDepartmentsRequest): Promise<GetRolesAndDepartmentsResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasAdminPermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Admin permissions required' };
      }

      // Get active roles and departments
      const [roles, departments] = await Promise.all([
        this.roleRepository.findActive(),
        this.departmentRepository.findAll()
      ]);

      // Filter active departments and format response
      const activeDepartments = departments
        .filter(dept => dept.isActive)
        .map(dept => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          isActive: dept.isActive
        }));

      return {
        success: true,
        data: {
          roles,
          departments: activeDepartments
        }
      };

    } catch (error) {
      console.error('Error getting roles and departments:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get roles and departments' 
      };
    }
  }

  private hasAdminPermissions(roleName?: string): boolean {
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }
}
