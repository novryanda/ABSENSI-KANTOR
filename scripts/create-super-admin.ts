import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating Super Admin account...');

    // Super Admin credentials
    const superAdminData = {
      nip: '199001010001',
      name: 'Super Administrator',
      email: 'superadmin@company.com',
      password: 'SuperAdmin123!', // Strong default password
      phone: '+6281234567890'
    };

    // First, ensure Super Admin role exists
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.log('📝 Creating Super Admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          permissions: {
            // Special super admin flag
            all: true,
            // User management
            users: { create: true, read: true, update: true, delete: true },
            // Department management
            departments: { create: true, read: true, update: true, delete: true },
            // Role management
            roles: { create: true, read: true, update: true, delete: true },
            // Attendance management
            attendance: { create: true, read: true, update: true, delete: true },
            // Request management
            requests: { create: true, read: true, update: true, delete: true, approve: true },
            // Report access
            reports: { create: true, read: true, update: true, delete: true, export: true },
            // System settings
            settings: { create: true, read: true, update: true, delete: true },
            // Audit logs
            audit: { read: true },
            // System administration
            system: { create: true, read: true, update: true, delete: true, backup: true, restore: true },
            // Team/supervisor permissions
            team_attendance: { read: true, update: true },
            team_reports: { read: true, export: true },
            department_reports: { read: true, export: true },
            approvals: { read: true, approve: true }
          },
          isActive: true
        }
      });
      console.log('✅ Super Admin role created');
    } else {
      console.log('⏭️  Super Admin role already exists');
    }

    // Check if Super Admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: superAdminData.email },
          { nip: superAdminData.nip }
        ]
      },
      include: {
        role: true
      }
    });

    if (existingUser) {
      console.log('⚠️  Super Admin user already exists:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   NIP: ${existingUser.nip}`);
      console.log(`   Role: ${existingUser.role?.name || 'No role'}`);
      
      // Update role if needed
      if (existingUser.role?.name !== 'Super Admin') {
        console.log('🔄 Updating user role to Super Admin...');
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { roleId: superAdminRole.id }
        });
        console.log('✅ User role updated to Super Admin');
      }
      
      console.log('\n📋 Super Admin Account Details:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   NIP: ${existingUser.nip}`);
      console.log(`   Password: Use existing password or reset if needed`);
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(superAdminData.password, 12);

    // Create Super Admin user
    console.log('👤 Creating Super Admin user...');
    const superAdminUser = await prisma.user.create({
      data: {
        nip: superAdminData.nip,
        name: superAdminData.name,
        email: superAdminData.email,
        passwordHash: hashedPassword,
        phone: superAdminData.phone,
        status: 'ACTIVE',
        roleId: superAdminRole.id,
        hireDate: new Date(),
        emailVerified: new Date() // Mark as verified
      },
      include: {
        role: true
      }
    });

    console.log('✅ Super Admin account created successfully!');
    console.log('\n📋 Super Admin Account Details:');
    console.log(`   Name: ${superAdminUser.name}`);
    console.log(`   Email: ${superAdminUser.email}`);
    console.log(`   NIP: ${superAdminUser.nip}`);
    console.log(`   Phone: ${superAdminUser.phone}`);
    console.log(`   Role: ${superAdminUser.role?.name}`);
    console.log(`   Password: ${superAdminData.password}`);
    console.log(`   Status: ${superAdminUser.status}`);

    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to /auth/signin');
    console.log(`2. Use email: ${superAdminUser.email}`);
    console.log(`3. Use password: ${superAdminData.password}`);
    console.log('4. Change password after first login for security');

    console.log('\n⚠️  Security Recommendations:');
    console.log('1. Change the default password immediately after first login');
    console.log('2. Enable two-factor authentication if available');
    console.log('3. Use a strong, unique password');
    console.log('4. Regularly review admin activities in audit logs');

    // Log audit action
    try {
      await prisma.auditLog.create({
        data: {
          userId: superAdminUser.id,
          action: 'SUPER_ADMIN_CREATED',
          tableName: 'users',
          recordId: superAdminUser.id,
          newValues: {
            name: superAdminUser.name,
            email: superAdminUser.email,
            nip: superAdminUser.nip,
            role: 'Super Admin',
            createdBy: 'SYSTEM_SCRIPT'
          },
          ipAddress: 'localhost',
          userAgent: 'create-super-admin-script'
        }
      });
      console.log('📝 Audit log created');
    } catch (auditError) {
      console.log('⚠️  Could not create audit log (this is optional)');
    }

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.log('\n💡 Tip: A user with this email or NIP might already exist.');
        console.log('   Check existing users or use different credentials.');
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Additional function to reset Super Admin password
async function resetSuperAdminPassword() {
  try {
    console.log('🔄 Resetting Super Admin password...');
    
    const newPassword = 'NewSuperAdmin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updatedUser = await prisma.user.updateMany({
      where: {
        OR: [
          { email: 'superadmin@company.com' },
          { nip: '199001010001' }
        ]
      },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    });

    if (updatedUser.count > 0) {
      console.log('✅ Super Admin password reset successfully!');
      console.log(`   New password: ${newPassword}`);
      console.log('   Please change this password after login');
    } else {
      console.log('❌ Super Admin user not found');
    }

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  if (command === 'reset-password') {
    resetSuperAdminPassword()
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    createSuperAdmin()
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

export { createSuperAdmin, resetSuperAdminPassword };
