# Permission System Fix Documentation

## Issue Description

**Error**: `TypeError: resourcePermissions.includes is not a function`
**Location**: `src/hooks/useAuth.ts:134:115` in the `hasPermission` function
**Cause**: Mismatch between permission data structure in database (JSON object) and frontend expectation (array)

## Root Cause Analysis

### 1. **Database Structure**
Permissions are stored in the database as JSON objects:
```json
{
  "users": { "create": true, "read": true, "update": true, "delete": false },
  "departments": { "create": false, "read": true, "update": false, "delete": false }
}
```

### 2. **Frontend Expectation**
The original `hasPermission` function expected permissions as arrays:
```javascript
// This was expecting: resourcePermissions = ['create', 'read', 'update']
return resourcePermissions?.includes(action) || false
```

### 3. **Sidebar Usage**
Sidebar components call permission checks like:
```javascript
hasPermission('users', 'read')  // Expected object.read, got array.includes()
```

## Solution Implemented

### 1. **Updated Type Definitions** (`src/types/auth.ts`)

Added comprehensive `RolePermissions` interface:
```typescript
export interface RolePermissions {
  // Special permission for super admin
  all?: boolean;
  
  // Resource-based permissions
  users?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  departments?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  // ... other resources
}
```

### 2. **Fixed Permission Checking Logic** (`src/hooks/useAuth.ts`)

Updated `hasPermission` function to handle both formats:
```typescript
const hasPermission = useCallback((resource: string, action: string) => {
  if (!user?.role?.permissions) return false

  const permissions = user.role.permissions as RolePermissions

  // Super admin bypass - check for all permission or Super Admin role
  if (permissions.all === true || user.role.name === 'Super Admin') return true

  // Check specific resource permission
  const resourcePermissions = permissions[resource as keyof RolePermissions]

  // Handle different permission structures
  if (Array.isArray(resourcePermissions)) {
    // Legacy array format: ['create', 'read', 'update', 'delete']
    return resourcePermissions.includes(action)
  } else if (typeof resourcePermissions === 'object' && resourcePermissions !== null) {
    // New object format: { create: true, read: true, update: false, delete: false }
    return resourcePermissions[action as keyof typeof resourcePermissions] === true
  }

  return false
}, [user?.role?.permissions, user?.role?.name])
```

### 3. **Updated Database Seeds**

All role creation scripts now use the correct permission structure:
```typescript
permissions: {
  all: true, // Super admin flag
  users: { create: true, read: true, update: true, delete: true },
  departments: { create: true, read: true, update: true, delete: true },
  // ... other permissions
}
```

## Files Modified

### Core Files
1. **`src/types/auth.ts`** - Added `RolePermissions` interface
2. **`src/hooks/useAuth.ts`** - Fixed `hasPermission` function
3. **`scripts/setup-super-admin.ts`** - Updated permission structure
4. **`scripts/create-super-admin.ts`** - Updated permission structure
5. **`scripts/seed-roles-departments.ts`** - Updated all role permissions

### Testing Files
6. **`scripts/test-permissions.ts`** - New testing script
7. **`docs/PERMISSION_SYSTEM_FIX.md`** - This documentation

## Testing the Fix

### 1. **Setup Database with Correct Permissions**
```bash
# Seed roles with correct permission structure
npm run db:seed-roles

# Create Super Admin with correct permissions
npm run setup-admin
```

### 2. **Test Permission System**
```bash
# Test permission structure and logic
npm run test-permissions

# List admin users
npm run list-admins
```

### 3. **Test Frontend**
1. Start the application: `npm run dev`
2. Login with Super Admin credentials:
   - Email: `superadmin@company.com`
   - Password: `SuperAdmin123!`
3. Navigate to admin panel: `/admin`
4. Check sidebar navigation (should work without errors)
5. Access user management: `/admin/users`

## Permission Structure Reference

### Super Admin
```json
{
  "all": true,
  "users": { "create": true, "read": true, "update": true, "delete": true },
  "departments": { "create": true, "read": true, "update": true, "delete": true },
  "roles": { "create": true, "read": true, "update": true, "delete": true },
  "attendance": { "create": true, "read": true, "update": true, "delete": true },
  "requests": { "create": true, "read": true, "update": true, "delete": true, "approve": true },
  "reports": { "create": true, "read": true, "update": true, "delete": true, "export": true },
  "settings": { "create": true, "read": true, "update": true, "delete": true },
  "audit": { "read": true },
  "system": { "create": true, "read": true, "update": true, "delete": true, "backup": true, "restore": true },
  "team_attendance": { "read": true, "update": true },
  "team_reports": { "read": true, "export": true },
  "department_reports": { "read": true, "export": true },
  "approvals": { "read": true, "approve": true }
}
```

### Admin
```json
{
  "users": { "create": true, "read": true, "update": true, "delete": false },
  "departments": { "create": true, "read": true, "update": true, "delete": false },
  "roles": { "create": false, "read": true, "update": false, "delete": false },
  "attendance": { "create": true, "read": true, "update": true, "delete": false },
  "requests": { "create": true, "read": true, "update": true, "delete": false, "approve": true },
  "reports": { "create": true, "read": true, "update": true, "delete": false, "export": true },
  "settings": { "create": false, "read": true, "update": true, "delete": false },
  "team_attendance": { "read": true, "update": true },
  "team_reports": { "read": true, "export": true },
  "department_reports": { "read": true, "export": true },
  "approvals": { "read": true, "approve": true }
}
```

### HR Admin
```json
{
  "users": { "create": true, "read": true, "update": true, "delete": false },
  "departments": { "create": false, "read": true, "update": false, "delete": false },
  "roles": { "create": false, "read": true, "update": false, "delete": false },
  "attendance": { "create": false, "read": true, "update": false, "delete": false },
  "requests": { "create": true, "read": true, "update": true, "delete": false, "approve": true },
  "reports": { "create": true, "read": true, "update": false, "delete": false, "export": true },
  "approvals": { "read": true, "approve": true }
}
```

### Atasan (Supervisor)
```json
{
  "users": { "create": false, "read": true, "update": false, "delete": false },
  "departments": { "create": false, "read": true, "update": false, "delete": false },
  "attendance": { "create": false, "read": true, "update": false, "delete": false },
  "requests": { "create": true, "read": true, "update": false, "delete": false, "approve": true },
  "reports": { "create": false, "read": true, "update": false, "delete": false, "export": true },
  "team_attendance": { "read": true, "update": false },
  "team_reports": { "read": true, "export": true },
  "approvals": { "read": true, "approve": true }
}
```

### Pegawai (Employee)
```json
{
  "attendance": { "create": true, "read": true, "update": false, "delete": false },
  "requests": { "create": true, "read": true, "update": false, "delete": false },
  "reports": { "create": false, "read": true, "update": false, "delete": false, "export": false }
}
```

## Troubleshooting

### Issue: Still getting permission errors
**Solution**:
1. Clear browser cache and cookies
2. Logout and login again
3. Check database for correct permission structure:
   ```sql
   SELECT name, permissions FROM roles WHERE name = 'Super Admin';
   ```

### Issue: Sidebar not showing admin sections
**Solution**:
1. Verify user has correct role assignment
2. Check permission structure in database
3. Test with `npm run test-permissions`

### Issue: Database has old permission format
**Solution**:
```bash
# Re-seed roles with correct structure
npm run db:seed-roles

# Update existing Super Admin
npm run setup-admin
```

## Future Considerations

### 1. **Permission Caching**
Consider implementing permission caching to improve performance:
```typescript
const permissionCache = useMemo(() => {
  // Cache computed permissions
}, [user?.role?.permissions])
```

### 2. **Permission Middleware**
Add server-side permission validation:
```typescript
export function withPermission(resource: string, action: string) {
  return (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    // Validate permissions server-side
  }
}
```

### 3. **Dynamic Permissions**
Consider implementing dynamic permissions that can be updated without code changes:
```typescript
interface DynamicPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}
```

## Summary

The permission system has been fixed to properly handle the JSON object structure used in the database. The fix includes:

1. ✅ **Type Safety**: Proper TypeScript interfaces for permissions
2. ✅ **Backward Compatibility**: Support for both array and object formats
3. ✅ **Super Admin Bypass**: Special handling for super admin permissions
4. ✅ **Comprehensive Testing**: Scripts to verify permission functionality
5. ✅ **Documentation**: Clear structure and usage guidelines

The system now properly supports the admin user management functionality with role-based access control.
