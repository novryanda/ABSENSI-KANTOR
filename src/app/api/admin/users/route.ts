import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { CreateUserByAdmin } from '@/use-cases/admin/CreateUserByAdmin';
import { GetUsersList } from '@/use-cases/admin/GetUsersList';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { PrismaRoleRepository } from '@/infrastructure/database/repositories/RoleRepository';
import { PrismaDepartmentRepository } from '@/infrastructure/database/repositories/DepartmentRepository';
import { prisma } from '@/infrastructure/prismaClient';
import { UserStatus, Gender } from '@prisma/client';

// Initialize repositories
const userRepository = new PrismaUserRepository(prisma);
const roleRepository = new PrismaRoleRepository(prisma);
const departmentRepository = new PrismaDepartmentRepository(prisma);

// Initialize use cases
const createUserByAdmin = new CreateUserByAdmin(userRepository, roleRepository, departmentRepository);
const getUsersList = new GetUsersList(userRepository);

// GET /api/admin/users - Get users list with pagination and filters
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as UserStatus | null;
    const roleId = searchParams.get('roleId');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    const result = await getUsersList.execute({
      adminUserId: session.user.id,
      page,
      limit,
      status: status || undefined,
      roleId: roleId || undefined,
      departmentId: departmentId || undefined,
      search: search || undefined
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate required fields
    if (!body.name || !body.email || !body.nip) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and NIP are required' },
        { status: 400 }
      );
    }

    const result = await createUserByAdmin.execute({
      name: body.name,
      email: body.email,
      nip: body.nip,
      phone: body.phone,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      gender: body.gender as Gender | undefined,
      address: body.address,
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
      departmentId: body.departmentId,
      roleId: body.roleId,
      adminUserId: session.user.id,
      ipAddress,
      userAgent,
      generatePassword: body.generatePassword !== false,
      customPassword: body.customPassword
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Don't return the full user entity with password hash
    const responseData = {
      success: true,
      data: {
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          nip: result.user!.nip,
          phone: result.user!.phone,
          status: result.user!.status,
          departmentId: result.user!.departmentId,
          roleId: result.user!.roleId,
          createdAt: result.user!.createdAt
        },
        temporaryPassword: result.temporaryPassword
      }
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
