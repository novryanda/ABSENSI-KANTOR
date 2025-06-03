import { IUserRepository, UserWithRelations, UserFilters } from '../../domain/repositories/IUserRepository';
import { UserStatus } from '@prisma/client';

export interface GetUsersListRequest {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  status?: UserStatus;
  roleId?: string;
  departmentId?: string;
  search?: string;
  
  // Admin context
  adminUserId: string;
}

export interface GetUsersListResponse {
  success: boolean;
  data?: {
    users: UserWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

export class GetUsersList {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: GetUsersListRequest): Promise<GetUsersListResponse> {
    try {
      // Validate admin permissions
      const adminUser = await this.userRepository.findWithRoleAndDepartment(request.adminUserId);
      if (!adminUser || !this.hasAdminPermissions(adminUser.role?.name)) {
        return { success: false, error: 'Unauthorized: Admin permissions required' };
      }

      // Set default pagination
      const page = Math.max(1, request.page || 1);
      const limit = Math.min(100, Math.max(1, request.limit || 20));
      const offset = (page - 1) * limit;

      // Build filters
      const filters: UserFilters = {};
      
      if (request.status) {
        filters.status = request.status;
      }
      
      if (request.roleId) {
        filters.roleId = request.roleId;
      }
      
      if (request.departmentId) {
        filters.departmentId = request.departmentId;
      }
      
      if (request.search?.trim()) {
        filters.search = request.search.trim();
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        this.userRepository.findManyWithRelations(filters, limit, offset),
        this.userRepository.countMany(filters)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev
          }
        }
      };

    } catch (error) {
      console.error('Error getting users list:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get users list' 
      };
    }
  }

  private hasAdminPermissions(roleName?: string): boolean {
    return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
  }
}
