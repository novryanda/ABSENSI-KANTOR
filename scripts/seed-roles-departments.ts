import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRolesAndDepartments() {
  try {
    console.log('🌱 Starting to seed roles and departments...');

    // Create roles if they don't exist
    const roles = [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: {
          all: true,
          users: { create: true, read: true, update: true, delete: true },
          departments: { create: true, read: true, update: true, delete: true },
          roles: { create: true, read: true, update: true, delete: true },
          attendance: { create: true, read: true, update: true, delete: true },
          requests: { create: true, read: true, update: true, delete: true, approve: true },
          reports: { create: true, read: true, update: true, delete: true, export: true },
          settings: { create: true, read: true, update: true, delete: true },
          audit: { read: true },
          system: { create: true, read: true, update: true, delete: true, backup: true, restore: true },
          team_attendance: { read: true, update: true },
          team_reports: { read: true, export: true },
          department_reports: { read: true, export: true },
          approvals: { read: true, approve: true }
        }
      },
      {
        name: 'Admin',
        description: 'Administrative access with limited system settings',
        permissions: {
          users: { create: true, read: true, update: true, delete: false },
          departments: { create: true, read: true, update: true, delete: false },
          roles: { create: false, read: true, update: false, delete: false },
          attendance: { create: true, read: true, update: true, delete: false },
          requests: { create: true, read: true, update: true, delete: false, approve: true },
          reports: { create: true, read: true, update: true, delete: false, export: true },
          settings: { create: false, read: true, update: true, delete: false },
          team_attendance: { read: true, update: true },
          team_reports: { read: true, export: true },
          department_reports: { read: true, export: true },
          approvals: { read: true, approve: true }
        }
      },
      {
        name: 'HR Admin',
        description: 'Human Resources administrative access',
        permissions: {
          users: { create: true, read: true, update: true, delete: false },
          departments: { create: false, read: true, update: false, delete: false },
          roles: { create: false, read: true, update: false, delete: false },
          attendance: { create: false, read: true, update: false, delete: false },
          requests: { create: true, read: true, update: true, delete: false, approve: true },
          reports: { create: true, read: true, update: false, delete: false, export: true },
          approvals: { read: true, approve: true }
        }
      },
      {
        name: 'Atasan',
        description: 'Supervisor with approval permissions',
        permissions: {
          users: { create: false, read: true, update: false, delete: false },
          departments: { create: false, read: true, update: false, delete: false },
          attendance: { create: false, read: true, update: false, delete: false },
          requests: { create: true, read: true, update: false, delete: false, approve: true },
          reports: { create: false, read: true, update: false, delete: false, export: true },
          team_attendance: { read: true, update: false },
          team_reports: { read: true, export: true },
          approvals: { read: true, approve: true }
        }
      },
      {
        name: 'Pegawai',
        description: 'Regular employee access',
        permissions: {
          attendance: { create: true, read: true, update: false, delete: false },
          requests: { create: true, read: true, update: false, delete: false },
          reports: { create: false, read: true, update: false, delete: false, export: false }
        }
      }
    ];

    for (const roleData of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      });

      if (!existingRole) {
        await prisma.role.create({
          data: roleData
        });
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        // Update permissions if role exists
        await prisma.role.update({
          where: { name: roleData.name },
          data: {
            permissions: roleData.permissions,
            description: roleData.description
          }
        });
        console.log(`🔄 Updated role: ${roleData.name}`);
      }
    }

    // Create departments if they don't exist
    const departments = [
      {
        code: 'IT',
        name: 'Information Technology',
        description: 'Manages IT infrastructure and software development'
      },
      {
        code: 'HR',
        name: 'Human Resources',
        description: 'Manages employee relations and organizational development'
      },
      {
        code: 'FIN',
        name: 'Finance',
        description: 'Manages financial operations and accounting'
      },
      {
        code: 'OPS',
        name: 'Operations',
        description: 'Manages daily operational activities'
      },
      {
        code: 'MKT',
        name: 'Marketing',
        description: 'Manages marketing and promotional activities'
      },
      {
        code: 'SALES',
        name: 'Sales',
        description: 'Manages sales activities and customer relations'
      },
      {
        code: 'LEGAL',
        name: 'Legal',
        description: 'Manages legal affairs and compliance'
      },
      {
        code: 'ADMIN',
        name: 'Administration',
        description: 'Manages general administrative tasks'
      }
    ];

    for (const deptData of departments) {
      const existingDept = await prisma.department.findUnique({
        where: { code: deptData.code }
      });

      if (!existingDept) {
        await prisma.department.create({
          data: deptData
        });
        console.log(`✅ Created department: ${deptData.name} (${deptData.code})`);
      } else {
        console.log(`⏭️  Department already exists: ${deptData.name} (${deptData.code})`);
      }
    }

    console.log('🎉 Roles and departments seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding roles and departments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedRolesAndDepartments()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedRolesAndDepartments;
