# Admin User Management Implementation

## Overview

Implementasi fitur manajemen pengguna untuk admin yang mengikuti pola clean architecture dengan role-based authorization, validasi komprehensif, audit logging, dan keamanan yang ketat.

## Features Implemented

### 1. **Role-based Authorization**
- Hanya pengguna dengan role `Admin`, `Super Admin`, atau `HR Admin` yang dapat mengakses fitur ini
- Validasi permission di level middleware, API, dan use case
- Hierarki role dengan permission yang berbeda-beda

### 2. **User Account Creation**
- Form pembuatan akun yang komprehensif dengan validasi
- Generate password otomatis atau custom password
- Validasi email, NIP, dan nomor telepon yang unik
- Assignment role dan departemen
- Audit logging untuk setiap pembuatan akun

### 3. **User Management Interface**
- Daftar pengguna dengan pagination dan filtering
- Search berdasarkan nama, email, atau NIP
- Filter berdasarkan status, role, dan departemen
- Detail pengguna dalam modal
- Actions untuk edit, reset password, activate/deactivate

### 4. **Security Features**
- Password hashing dengan bcrypt
- Input validation dan sanitization
- CSRF protection melalui NextAuth
- Audit logging untuk semua aktivitas admin
- Session management yang aman

## Architecture

### Domain Layer
```
src/domain/
├── entities/User.ts                 # User entity dengan business logic
├── repositories/
│   ├── IUserRepository.ts          # Extended dengan admin methods
│   └── IRoleRepository.ts          # Role repository interface
```

### Use Cases Layer
```
src/use-cases/admin/
├── CreateUserByAdmin.ts            # Use case untuk pembuatan user
├── GetUsersList.ts                 # Use case untuk list users
└── GetRolesAndDepartments.ts       # Use case untuk data dropdown
```

### Infrastructure Layer
```
src/infrastructure/database/repositories/
├── UserRepository.ts               # Extended dengan admin methods
└── RoleRepository.ts               # Role repository implementation
```

### API Layer
```
src/app/api/admin/
├── users/route.ts                  # CRUD operations untuk users
└── roles-departments/route.ts      # Endpoint untuk dropdown data
```

### Presentation Layer
```
src/app/(dashboard)/admin/
├── layout.tsx                      # Admin layout dengan auth guard
├── page.tsx                        # Admin dashboard
└── users/page.tsx                  # User management page

src/components/admin/
├── CreateUserModal.tsx             # Modal untuk create user
└── UserDetailsModal.tsx            # Modal untuk detail user
```

## API Endpoints

### GET /api/admin/users
**Description**: Mendapatkan daftar pengguna dengan pagination dan filtering

**Query Parameters**:
- `page` (number): Halaman (default: 1)
- `limit` (number): Jumlah per halaman (default: 20, max: 100)
- `status` (UserStatus): Filter berdasarkan status
- `roleId` (string): Filter berdasarkan role
- `departmentId` (string): Filter berdasarkan departemen
- `search` (string): Search nama, email, atau NIP

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [...],
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

### POST /api/admin/users
**Description**: Membuat pengguna baru

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "nip": "string (required)",
  "phone": "string (optional)",
  "birthDate": "string (optional)",
  "gender": "MALE|FEMALE (optional)",
  "address": "string (optional)",
  "hireDate": "string (optional)",
  "departmentId": "string (optional)",
  "roleId": "string (optional)",
  "generatePassword": "boolean (default: true)",
  "customPassword": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "temporaryPassword": "string (if generated)"
  }
}
```

### GET /api/admin/roles-departments
**Description**: Mendapatkan daftar role dan departemen aktif untuk dropdown

**Response**:
```json
{
  "success": true,
  "data": {
    "roles": [...],
    "departments": [...]
  }
}
```

## Database Schema Updates

### Roles Table
```sql
-- Roles dengan permissions JSON
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSON DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Audit Logs Table
```sql
-- Audit logging untuk tracking aktivitas admin
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSON,
  new_values JSON,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

### 1. **Authentication & Authorization**
- NextAuth session validation
- Role-based access control di semua layer
- Middleware protection untuk admin routes

### 2. **Input Validation**
- Email format validation
- NIP format validation (18 digits)
- Phone number format validation (Indonesian format)
- Password strength requirements (minimum 8 characters)

### 3. **Data Protection**
- Password hashing dengan bcrypt (salt rounds: 12)
- Sensitive data tidak di-return di API response
- Audit logging untuk compliance

### 4. **Rate Limiting & Monitoring**
- Audit logging untuk semua admin actions
- IP address dan user agent tracking
- Error logging untuk debugging

## Usage Examples

### 1. **Creating a New User**
```typescript
// Admin creates new employee
const result = await createUserByAdmin.execute({
  name: "John Doe",
  email: "john.doe@company.com",
  nip: "123456789012345678",
  phone: "+6281234567890",
  departmentId: "dept-id",
  roleId: "role-id",
  adminUserId: "admin-id",
  generatePassword: true
});

if (result.success) {
  console.log("User created:", result.user);
  console.log("Temporary password:", result.temporaryPassword);
}
```

### 2. **Getting Users List**
```typescript
// Get paginated users list with filters
const result = await getUsersList.execute({
  adminUserId: "admin-id",
  page: 1,
  limit: 20,
  status: "ACTIVE",
  search: "john"
});

if (result.success) {
  console.log("Users:", result.data.users);
  console.log("Pagination:", result.data.pagination);
}
```

## Testing

### 1. **Setup Test Data**
```bash
# Seed roles and departments
npm run db:seed-roles
```

### 2. **Test Admin Access**
1. Login dengan akun admin (Super Admin, Admin, atau HR Admin)
2. Navigate ke `/admin/users`
3. Test create user functionality
4. Test filtering dan search
5. Test user details modal

### 3. **Test Security**
1. Test akses dengan role non-admin (should be blocked)
2. Test input validation (invalid email, NIP, etc.)
3. Test duplicate data prevention
4. Test audit logging

## Future Enhancements

### 1. **User Management**
- [ ] Bulk user import dari CSV/Excel
- [ ] User profile photo upload
- [ ] Advanced user search dengan multiple criteria
- [ ] User activity timeline

### 2. **Security**
- [ ] Two-factor authentication setup
- [ ] Password policy configuration
- [ ] Session management dashboard
- [ ] Advanced audit reporting

### 3. **Integration**
- [ ] LDAP/Active Directory integration
- [ ] Email notifications untuk user creation
- [ ] SMS notifications untuk password reset
- [ ] Integration dengan HR systems

### 4. **Reporting**
- [ ] User analytics dashboard
- [ ] Role usage statistics
- [ ] Department user distribution
- [ ] Export user data ke various formats

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Pastikan user memiliki role Admin/Super Admin/HR Admin
   - Check middleware configuration
   - Verify session validity

2. **Validation Errors**
   - Email format harus valid
   - NIP harus 18 digit
   - Phone number harus format Indonesia
   - Password minimal 8 karakter

3. **Database Errors**
   - Check unique constraints (email, NIP, phone)
   - Verify foreign key references (roleId, departmentId)
   - Check database connection

4. **UI Issues**
   - Clear browser cache
   - Check console for JavaScript errors
   - Verify API endpoints are accessible

## Support

Untuk pertanyaan atau issues terkait implementasi admin user management:

1. Check dokumentasi ini terlebih dahulu
2. Review audit logs untuk debugging
3. Check browser console untuk error messages
4. Verify database schema dan data integrity
