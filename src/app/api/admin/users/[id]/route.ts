import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { UpdateUserByAdmin } from '@/use-cases/admin/UpdateUserByAdmin';
import { DeleteUserByAdmin, ToggleUserStatus } from '@/use-cases/admin/DeleteUserByAdmin';
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
const updateUserByAdmin = new UpdateUserByAdmin(userRepository, roleRepository, departmentRepository);
const deleteUserByAdmin = new DeleteUserByAdmin(userRepository);
const toggleUserStatus = new ToggleUserStatus(userRepository);

// GET /api/admin/users/[id] - Get specific user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const user = await userRepository.findWithRoleAndDepartment(params.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      nip: user.nip,
      phone: user.phone,
      birthDate: user.birthDate,
      gender: user.gender,
      address: user.address,
      hireDate: user.hireDate,
      status: user.status,
      departmentId: user.departmentId,
      roleId: user.roleId,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      department: user.department
    };

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await updateUserByAdmin.execute({
      userId: params.id,
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
      status: body.status as UserStatus | undefined,
      adminUserId: session.user.id,
      ipAddress,
      userAgent
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return updated user data without sensitive information
    const userData = {
      id: result.user!.id,
      name: result.user!.name,
      email: result.user!.email,
      nip: result.user!.nip,
      phone: result.user!.phone,
      birthDate: result.user!.birthDate,
      gender: result.user!.gender,
      address: result.user!.address,
      hireDate: result.user!.hireDate,
      status: result.user!.status,
      departmentId: result.user!.departmentId,
      roleId: result.user!.roleId,
      updatedAt: result.user!.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse query parameters for delete options
    const { searchParams } = new URL(request.url);
    const softDelete = searchParams.get('soft') !== 'false'; // Default to soft delete
    const reason = searchParams.get('reason') || undefined;

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await deleteUserByAdmin.execute({
      userId: params.id,
      softDelete,
      reason,
      adminUserId: session.user.id,
      ipAddress,
      userAgent
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
