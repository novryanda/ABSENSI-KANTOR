import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { ResetUserPassword } from '@/use-cases/admin/ResetUserPassword';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { prisma } from '@/infrastructure/prismaClient';

// Initialize repository and use case
const userRepository = new PrismaUserRepository(prisma);
const resetUserPassword = new ResetUserPassword(userRepository);

// POST /api/admin/users/[id]/reset-password - Reset user password
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

    const body = await request.json();

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await resetUserPassword.execute({
      userId: params.id,
      generatePassword: body.generatePassword !== false,
      customPassword: body.customPassword,
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
        temporaryPassword: result.temporaryPassword
      }
    });

  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/reset-password:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
