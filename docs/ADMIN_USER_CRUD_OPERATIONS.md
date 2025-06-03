# Admin User CRUD Operations Documentation

## Overview

Dokumentasi lengkap untuk operasi CRUD (Create, Read, Update, Delete) pada sistem manajemen pengguna admin. Implementasi mengikuti pola clean architecture dengan keamanan, validasi, dan audit logging yang komprehensif.

## Features Implemented

### ✅ **Complete CRUD Operations**
1. **Create User** - Pembuatan pengguna baru dengan validasi lengkap
2. **Read User** - Melihat daftar dan detail pengguna dengan pagination/filtering
3. **Update User** - Edit informasi pengguna dengan conflict checking
4. **Delete User** - Soft delete dan hard delete dengan konfirmasi
5. **Additional Operations** - Toggle status, reset password, bulk actions

### ✅ **Security & Authorization**
- Role-based access control untuk semua operasi
- Prevent self-modification untuk field kritis
- Audit logging untuk semua aktivitas
- Input validation dan sanitization

### ✅ **User Experience**
- Modal-based interfaces untuk semua operasi
- Loading states dan error handling
- Success/failure notifications
- Confirmation dialogs untuk operasi destructive

## Architecture Overview

### **Use Cases Layer**
```
src/use-cases/admin/
├── CreateUserByAdmin.ts        # User creation logic
├── UpdateUserByAdmin.ts        # User update logic
├── DeleteUserByAdmin.ts        # User deletion & status toggle
├── ResetUserPassword.ts        # Password reset logic
├── GetUsersList.ts            # User listing with filters
└── GetRolesAndDepartments.ts  # Supporting data
```

### **API Layer**
```
src/app/api/admin/users/
├── route.ts                   # GET (list), POST (create)
├── [id]/route.ts             # GET (detail), PUT (update), DELETE
├── [id]/toggle-status/route.ts # POST (toggle active/inactive)
└── [id]/reset-password/route.ts # POST (reset password)
```

### **Components Layer**
```
src/components/admin/
├── CreateUserModal.tsx        # User creation form
├── EditUserModal.tsx         # User editing form
├── DeleteUserModal.tsx       # Delete confirmation with options
├── ResetPasswordModal.tsx    # Password reset interface
└── UserDetailsModal.tsx      # User information display
```

## API Endpoints Reference

### **1. GET /api/admin/users**
**Purpose**: Get paginated list of users with filtering

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (UserStatus): Filter by user status
- `roleId` (string): Filter by role
- `departmentId` (string): Filter by department
- `search` (string): Search in name, email, NIP

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "name": "User Name",
        "email": "user@example.com",
        "nip": "123456789012345678",
        "phone": "+6281234567890",
        "status": "ACTIVE",
        "role": { "id": "role-id", "name": "Admin" },
        "department": { "id": "dept-id", "name": "IT", "code": "IT" },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "lastLogin": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### **2. POST /api/admin/users**
**Purpose**: Create new user

**Request Body**:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "nip": "123456789012345678",
  "phone": "+6281234567890",
  "birthDate": "1990-01-01",
  "gender": "MALE",
  "address": "User Address",
  "hireDate": "2024-01-01",
  "departmentId": "dept-id",
  "roleId": "role-id",
  "generatePassword": true,
  "customPassword": "optional-custom-password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "temporaryPassword": "generated-password"
  }
}
```

### **3. GET /api/admin/users/[id]**
**Purpose**: Get specific user details

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    /* ... complete user data with relations */
  }
}
```

### **4. PUT /api/admin/users/[id]**
**Purpose**: Update user information

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "status": "INACTIVE",
  /* ... other updatable fields */
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    /* updated user object */
  }
}
```

### **5. DELETE /api/admin/users/[id]**
**Purpose**: Delete user (soft or hard delete)

**Query Parameters**:
- `soft` (boolean): true for soft delete, false for hard delete (default: true)
- `reason` (string): Reason for deletion (optional)

**Response**:
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### **6. POST /api/admin/users/[id]/toggle-status**
**Purpose**: Toggle user active/inactive status

**Response**:
```json
{
  "success": true,
  "data": {
    "newStatus": "INACTIVE"
  }
}
```

### **7. POST /api/admin/users/[id]/reset-password**
**Purpose**: Reset user password

**Request Body**:
```json
{
  "generatePassword": true,
  "customPassword": "optional-custom-password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "temporaryPassword": "new-generated-password"
  }
}
```

## User Interface Components

### **1. Users List Page (`/admin/users`)**

**Features**:
- Paginated table with user information
- Search and filtering capabilities
- Action buttons for each user (View, Edit, Toggle Status, Reset Password, Delete)
- Bulk operations support
- Real-time loading states

**Action Buttons**:
- 👁️ **View**: Open user details modal
- ✏️ **Edit**: Open edit user modal
- 🔄 **Toggle Status**: Activate/deactivate user
- 🔑 **Reset Password**: Reset user password
- 🗑️ **Delete**: Delete user with confirmation

### **2. Create User Modal**

**Features**:
- Comprehensive form with all user fields
- Real-time validation
- Role and department selection
- Password generation options
- Success notification with temporary password display

### **3. Edit User Modal**

**Features**:
- Pre-populated form with existing user data
- Same validation as create form
- Conflict detection for unique fields
- Status change capability
- Audit logging for changes

### **4. Delete User Modal**

**Features**:
- User information display
- Soft delete vs hard delete options
- Reason for deletion input
- Dependency checking
- Confirmation with warnings for hard delete

### **5. Reset Password Modal**

**Features**:
- User information display
- Auto-generate vs custom password options
- Password strength validation
- Secure password display with copy functionality
- Instructions for user notification

## Security Considerations

### **1. Authorization Checks**
```typescript
// Role-based access control
const hasAdminPermissions = (roleName?: string): boolean => {
  return ['Admin', 'Super Admin', 'HR Admin'].includes(roleName || '');
};

// Prevent self-modification
if (request.userId === request.adminUserId) {
  if (request.roleId && request.roleId !== existingUser.roleId) {
    return { success: false, error: 'Cannot modify your own role' };
  }
}
```

### **2. Input Validation**
```typescript
// Email validation
if (request.email && !UserEntity.validateEmail(request.email)) {
  return 'Invalid email format';
}

// NIP validation (18 digits)
if (request.nip && !UserEntity.validateNIP(request.nip)) {
  return 'Invalid NIP format (must be 18 digits)';
}
```

### **3. Conflict Detection**
```typescript
// Check for unique constraint violations
const existingEmail = await this.userRepository.findByEmail(request.email);
if (existingEmail && existingEmail.id !== existingUser.id) {
  return 'User with this email already exists';
}
```

### **4. Audit Logging**
```typescript
// Log all admin actions
await logAuditAction({
  userId: request.adminUserId,
  action: 'USER_UPDATED_BY_ADMIN',
  tableName: 'users',
  recordId: request.userId,
  oldValues,
  newValues,
  ipAddress: request.ipAddress,
  userAgent: request.userAgent
});
```

## Business Rules

### **1. User Deletion**
- **Soft Delete (Default)**: Mark user as INACTIVE, preserve all data
- **Hard Delete**: Permanently remove user, only for Super Admin
- **Dependency Check**: Prevent deletion if user has active dependencies
- **Self-Protection**: Users cannot delete their own accounts

### **2. Status Management**
- **ACTIVE**: User can login and access system
- **INACTIVE**: User cannot login, data preserved
- **SUSPENDED**: Temporary restriction, can be reactivated

### **3. Role Management**
- **Self-Role Protection**: Users cannot change their own role
- **Super Admin Protection**: Only Super Admin can modify other Super Admin accounts
- **Role Validation**: Ensure target role exists and is active

### **4. Password Security**
- **Auto-Generation**: Secure random passwords with mixed characters
- **Custom Passwords**: Minimum 8 characters requirement
- **Temporary Passwords**: Must be changed on first login
- **Reset Logging**: All password resets are logged for security

## Error Handling

### **Common Error Scenarios**
1. **Unauthorized Access**: Non-admin users attempting admin operations
2. **User Not Found**: Attempting operations on non-existent users
3. **Validation Errors**: Invalid email, NIP, or other field formats
4. **Conflict Errors**: Duplicate email, NIP, or phone numbers
5. **Dependency Errors**: Attempting to delete users with active dependencies
6. **Self-Modification Errors**: Users attempting to modify their own critical data

### **Error Response Format**
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

## Testing Guidelines

### **1. Unit Tests**
- Test all use cases with various input scenarios
- Test validation logic and error conditions
- Test authorization checks
- Test conflict detection

### **2. Integration Tests**
- Test API endpoints with different user roles
- Test database operations and transactions
- Test audit logging functionality

### **3. UI Tests**
- Test modal interactions and form submissions
- Test loading states and error displays
- Test action button functionality
- Test responsive behavior

### **4. Security Tests**
- Test unauthorized access attempts
- Test input sanitization
- Test SQL injection prevention
- Test audit trail integrity

## Performance Considerations

### **1. Database Optimization**
- Use indexes on frequently queried fields (email, NIP, phone)
- Implement pagination for large user lists
- Use select specific fields to reduce data transfer

### **2. Frontend Optimization**
- Implement debounced search to reduce API calls
- Use loading states to improve perceived performance
- Cache role and department data

### **3. API Optimization**
- Implement rate limiting for admin operations
- Use compression for large responses
- Implement caching where appropriate

## Deployment Checklist

### **Before Deployment**
- [ ] Run all tests (unit, integration, security)
- [ ] Verify database migrations are applied
- [ ] Test with production-like data volume
- [ ] Verify audit logging is working
- [ ] Test role-based access control
- [ ] Verify email/notification systems (if implemented)

### **After Deployment**
- [ ] Monitor error logs for any issues
- [ ] Verify admin operations are working
- [ ] Check audit logs are being created
- [ ] Test user creation and password reset flows
- [ ] Monitor system performance

## Future Enhancements

### **Planned Features**
1. **Bulk Operations**: Select multiple users for bulk actions
2. **Advanced Filtering**: Date ranges, custom field filters
3. **Export Functionality**: Export user data to CSV/Excel
4. **User Import**: Bulk import users from CSV/Excel
5. **Email Notifications**: Notify users of account changes
6. **Advanced Audit**: Detailed audit trail with search/filter
7. **User Profile Photos**: Upload and manage user avatars
8. **Two-Factor Authentication**: Enhanced security for admin accounts

### **Technical Improvements**
1. **Real-time Updates**: WebSocket for live user status updates
2. **Advanced Search**: Full-text search with Elasticsearch
3. **Caching Layer**: Redis for improved performance
4. **API Rate Limiting**: Protect against abuse
5. **Advanced Validation**: Custom validation rules engine
6. **Backup/Restore**: Automated user data backup system

---

**Note**: This documentation covers the complete CRUD operations for admin user management. All features are implemented following clean architecture principles with comprehensive security, validation, and audit logging.
