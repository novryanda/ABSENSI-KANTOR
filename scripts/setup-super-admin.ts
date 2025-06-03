import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Predefined Super Admin configurations
const SUPER_ADMIN_CONFIGS = {
  default: {
    nip: '199001010001',
    name: 'Super Administrator',
    email: 'superadmin@company.com',
    password: 'SuperAdmin123!',
    phone: '+6281234567890'
  },
  demo: {
    nip: '199001010001',
    name: 'Demo Super Admin',
    email: 'demo@admin.com',
    password: 'DemoAdmin123!',
    phone: '+6281234567890'
  },
  custom: {
    nip: '199001010001',
    name: 'System Administrator',
    email: 'admin@system.com',
    password: 'SystemAdmin123!',
    phone: '+6281234567890'
  }
};

async function setupSuperAdmin(configType: keyof typeof SUPER_ADMIN_CONFIGS = 'default') {
  try {
    console.log('🚀 Setting up Super Admin account...');
    console.log(`📋 Using configuration: ${configType}`);

    const config = SUPER_ADMIN_CONFIGS[configType];

    // Step 1: Ensure Super Admin role exists
    console.log('\n1️⃣ Checking Super Admin role...');
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.log('   Creating Super Admin role...');
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
      console.log('   ✅ Super Admin role created');
    } else {
      console.log('   ✅ Super Admin role already exists');
    }

    // Step 2: Check for existing Super Admin user
    console.log('\n2️⃣ Checking existing Super Admin user...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: config.email },
          { nip: config.nip },
          { role: { name: 'Super Admin' } }
        ]
      },
      include: { role: true }
    });

    if (existingUser) {
      console.log('   ⚠️  Super Admin user already exists:');
      console.log(`      Name: ${existingUser.name}`);
      console.log(`      Email: ${existingUser.email}`);
      console.log(`      NIP: ${existingUser.nip}`);
      console.log(`      Role: ${existingUser.role?.name || 'No role'}`);

      // Update role if needed
      if (existingUser.roleId !== superAdminRole.id) {
        console.log('   🔄 Updating user role to Super Admin...');
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { roleId: superAdminRole.id }
        });
        console.log('   ✅ User role updated');
      }

      console.log('\n📋 Existing Super Admin Account:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   NIP: ${existingUser.nip}`);
      console.log('   Password: Use existing password or run reset command');
      return existingUser;
    }

    // Step 3: Create new Super Admin user
    console.log('\n3️⃣ Creating Super Admin user...');
    const hashedPassword = await bcrypt.hash(config.password, 12);

    const superAdminUser = await prisma.user.create({
      data: {
        nip: config.nip,
        name: config.name,
        email: config.email,
        passwordHash: hashedPassword,
        phone: config.phone,
        status: 'ACTIVE',
        roleId: superAdminRole.id,
        hireDate: new Date(),
        emailVerified: new Date()
      },
      include: { role: true }
    });

    console.log('   ✅ Super Admin user created');

    // Step 4: Create audit log
    console.log('\n4️⃣ Creating audit log...');
    try {
      await prisma.auditLog.create({
        data: {
          userId: superAdminUser.id,
          action: 'SUPER_ADMIN_SETUP',
          tableName: 'users',
          recordId: superAdminUser.id,
          newValues: {
            name: superAdminUser.name,
            email: superAdminUser.email,
            nip: superAdminUser.nip,
            role: 'Super Admin',
            configType,
            setupMethod: 'AUTOMATED_SCRIPT'
          },
          ipAddress: 'localhost',
          userAgent: 'setup-super-admin-script'
        }
      });
      console.log('   ✅ Audit log created');
    } catch (auditError) {
      console.log('   ⚠️  Audit log creation skipped (table may not exist)');
    }

    // Step 5: Display results
    console.log('\n🎉 Super Admin Setup Complete!');
    console.log('\n📋 Account Details:');
    console.log(`   Name: ${superAdminUser.name}`);
    console.log(`   Email: ${superAdminUser.email}`);
    console.log(`   NIP: ${superAdminUser.nip}`);
    console.log(`   Phone: ${superAdminUser.phone}`);
    console.log(`   Role: ${superAdminUser.role?.name}`);
    console.log(`   Password: ${config.password}`);
    console.log(`   Status: ${superAdminUser.status}`);

    console.log('\n🔐 Login Instructions:');
    console.log('1. Start your application');
    console.log('2. Navigate to /auth/signin');
    console.log(`3. Email: ${superAdminUser.email}`);
    console.log(`4. Password: ${config.password}`);
    console.log('5. Access admin panel at /admin');

    console.log('\n⚠️  Security Recommendations:');
    console.log('• Change the default password immediately after first login');
    console.log('• Review and update user permissions as needed');
    console.log('• Monitor admin activities through audit logs');
    console.log('• Consider enabling additional security measures');

    return superAdminUser;

  } catch (error) {
    console.error('\n❌ Error setting up Super Admin:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.log('\n💡 Tip: A user with this email or NIP already exists.');
        console.log('   Try using a different configuration or check existing users.');
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to list all admin users
async function listAdminUsers() {
  try {
    console.log('👥 Listing all admin users...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['Super Admin', 'Admin', 'HR Admin']
          }
        }
      },
      include: {
        role: true,
        department: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (adminUsers.length === 0) {
      console.log('   No admin users found');
      return;
    }

    console.log(`\n📋 Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   NIP: ${user.nip || 'N/A'}`);
      console.log(`   Role: ${user.role?.name || 'No role'}`);
      console.log(`   Department: ${user.department?.name || 'No department'}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error listing admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const configType = (args[1] as keyof typeof SUPER_ADMIN_CONFIGS) || 'default';

  if (command === 'list') {
    listAdminUsers().catch(console.error);
  } else if (command === 'demo') {
    setupSuperAdmin('demo').catch(console.error);
  } else if (command === 'custom') {
    setupSuperAdmin('custom').catch(console.error);
  } else {
    setupSuperAdmin(configType).catch(console.error);
  }
}

export { setupSuperAdmin, listAdminUsers };
