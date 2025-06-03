import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { GetRolesAndDepartments } from '@/use-cases/admin/GetRolesAndDepartments';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { PrismaRoleRepository } from '@/infrastructure/database/repositories/RoleRepository';
import { PrismaDepartmentRepository } from '@/infrastructure/database/repositories/DepartmentRepository';
import { prisma } from '@/infrastructure/prismaClient';

// Initialize repositories
const userRepository = new PrismaUserRepository(prisma);
const roleRepository = new PrismaRoleRepository(prisma);
const departmentRepository = new PrismaDepartmentRepository(prisma);

// Initialize use case
const getRolesAndDepartments = new GetRolesAndDepartments(
  roleRepository,
  departmentRepository,
  userRepository
);

// GET /api/admin/roles-departments - Get roles and departments for user creation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const userRole = session.user.role?.name;
    if (!['Admin', 'Super Admin', 'HR Admin'].includes(userRole || '')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin permissions required' },
        { status: 403 }
      );
    }

    const result = await getRolesAndDepartments.execute({
      adminUserId: session.user.id
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/admin/roles-departments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
