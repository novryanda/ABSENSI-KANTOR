import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { ToggleUserStatus } from '@/use-cases/admin/DeleteUserByAdmin';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { prisma } from '@/infrastructure/prismaClient';

// Initialize repository and use case
const userRepository = new PrismaUserRepository(prisma);
const toggleUserStatus = new ToggleUserStatus(userRepository);

// POST /api/admin/users/[id]/toggle-status - Toggle user active/inactive status
export async function POST(
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

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await toggleUserStatus.execute({
      userId: params.id,
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
      data: {
        newStatus: result.newStatus
      }
    });

  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/toggle-status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
