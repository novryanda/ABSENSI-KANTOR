import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPermissions() {
  try {
    console.log('🧪 Testing permission system...');

    // Get Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.log('❌ Super Admin role not found. Run seed-roles first.');
      return;
    }

    console.log('\n📋 Super Admin Role:');
    console.log(`   Name: ${superAdminRole.name}`);
    console.log(`   Description: ${superAdminRole.description}`);
    console.log(`   Permissions:`, JSON.stringify(superAdminRole.permissions, null, 2));

    // Test permission structure
    const permissions = superAdminRole.permissions as any;
    
    console.log('\n🔍 Testing permission structure:');
    
    // Test 'all' permission
    console.log(`   all permission: ${permissions.all}`);
    
    // Test users permissions
    console.log(`   users.read: ${permissions.users?.read}`);
    console.log(`   users.create: ${permissions.users?.create}`);
    console.log(`   users.update: ${permissions.users?.update}`);
    console.log(`   users.delete: ${permissions.users?.delete}`);
    
    // Test departments permissions
    console.log(`   departments.read: ${permissions.departments?.read}`);
    console.log(`   departments.create: ${permissions.departments?.create}`);
    
    // Test team permissions
    console.log(`   team_attendance.read: ${permissions.team_attendance?.read}`);
    console.log(`   approvals.approve: ${permissions.approvals?.approve}`);

    // Get all roles and their permissions
    console.log('\n📊 All Roles Summary:');
    const allRoles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    allRoles.forEach(role => {
      const perms = role.permissions as any;
      console.log(`\n   ${role.name}:`);
      console.log(`     Description: ${role.description}`);
      console.log(`     Has 'all' permission: ${perms.all || false}`);
      console.log(`     Can read users: ${perms.users?.read || false}`);
      console.log(`     Can create users: ${perms.users?.create || false}`);
      console.log(`     Can approve requests: ${perms.requests?.approve || false}`);
    });

    // Test with a Super Admin user if exists
    console.log('\n👤 Testing with Super Admin user:');
    const superAdminUser = await prisma.user.findFirst({
      where: {
        role: { name: 'Super Admin' }
      },
      include: {
        role: true,
        department: true
      }
    });

    if (superAdminUser) {
      console.log(`   Found Super Admin user: ${superAdminUser.name} (${superAdminUser.email})`);
      console.log(`   Role: ${superAdminUser.role?.name}`);
      console.log(`   Department: ${superAdminUser.department?.name || 'None'}`);
      
      const userPermissions = superAdminUser.role?.permissions as any;
      console.log(`   Has all permissions: ${userPermissions?.all || false}`);
      console.log(`   Can manage users: ${userPermissions?.users?.create && userPermissions?.users?.read}`);
    } else {
      console.log('   No Super Admin user found. Create one using setup-admin script.');
    }

    console.log('\n✅ Permission system test completed!');

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to simulate permission checking
function simulatePermissionCheck(permissions: any, resource: string, action: string): boolean {
  // Super admin bypass
  if (permissions.all === true) return true;

  // Check specific resource permission
  const resourcePermissions = permissions[resource];

  // Handle different permission structures
  if (Array.isArray(resourcePermissions)) {
    // Legacy array format: ['create', 'read', 'update', 'delete']
    return resourcePermissions.includes(action);
  } else if (typeof resourcePermissions === 'object' && resourcePermissions !== null) {
    // New object format: { create: true, read: true, update: false, delete: false }
    return resourcePermissions[action] === true;
  }

  return false;
}

async function testPermissionLogic() {
  try {
    console.log('\n🧮 Testing permission logic simulation...');

    const testCases = [
      { role: 'Super Admin', resource: 'users', action: 'read' },
      { role: 'Super Admin', resource: 'users', action: 'create' },
      { role: 'Super Admin', resource: 'departments', action: 'delete' },
      { role: 'Admin', resource: 'users', action: 'read' },
      { role: 'Admin', resource: 'users', action: 'delete' },
      { role: 'HR Admin', resource: 'users', action: 'create' },
      { role: 'HR Admin', resource: 'departments', action: 'create' },
      { role: 'Pegawai', resource: 'attendance', action: 'create' },
      { role: 'Pegawai', resource: 'users', action: 'read' },
    ];

    for (const testCase of testCases) {
      const role = await prisma.role.findUnique({
        where: { name: testCase.role }
      });

      if (role) {
        const hasPermission = simulatePermissionCheck(
          role.permissions,
          testCase.resource,
          testCase.action
        );

        console.log(`   ${testCase.role} can ${testCase.action} ${testCase.resource}: ${hasPermission ? '✅' : '❌'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing permission logic:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'logic') {
    testPermissionLogic().catch(console.error);
  } else {
    testPermissions()
      .then(() => testPermissionLogic())
      .catch(console.error);
  }
}

export { testPermissions, testPermissionLogic, simulatePermissionCheck };
