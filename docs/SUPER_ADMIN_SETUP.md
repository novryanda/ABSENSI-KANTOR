# Super Admin Setup Guide

## Overview

Panduan lengkap untuk membuat dan mengelola akun Super Admin dalam sistem inventory management. Super Admin memiliki akses penuh ke semua fitur sistem termasuk manajemen pengguna, role, departemen, dan pengaturan sistem.

## Quick Setup

### 1. **Setup Super Admin (Recommended)**
```bash
npm run setup-admin
```

Ini akan membuat akun Super Admin dengan konfigurasi default:
- **Email**: `superadmin@company.com`
- **NIP**: `199001010001`
- **Password**: `SuperAdmin123!`
- **Role**: Super Admin dengan semua permissions

### 2. **Setup Demo Super Admin**
```bash
npm run setup-admin-demo
```

Untuk environment demo/testing:
- **Email**: `demo@admin.com`
- **NIP**: `199001010001`
- **Password**: `DemoAdmin123!`

### 3. **List Existing Admin Users**
```bash
npm run list-admins
```

Menampilkan semua pengguna dengan role admin (Super Admin, Admin, HR Admin).

## Manual Setup Options

### Option 1: Using create-super-admin.ts
```bash
npm run create-super-admin
```

Script ini akan:
1. Membuat role Super Admin jika belum ada
2. Membuat akun Super Admin dengan kredensial default
3. Menampilkan detail akun yang dibuat
4. Membuat audit log

### Option 2: Reset Password
```bash
npm run reset-super-admin
```

Untuk reset password Super Admin yang sudah ada:
- Password baru: `NewSuperAdmin123!`

## Super Admin Credentials

### Default Configuration
```
Name: Super Administrator
Email: superadmin@company.com
NIP: 199001010001
Password: SuperAdmin123!
Phone: +6281234567890
Role: Super Admin
```

### Demo Configuration
```
Name: Demo Super Admin
Email: demo@admin.com
NIP: 199001010001
Password: DemoAdmin123!
Phone: +6281234567890
Role: Super Admin
```

## Super Admin Permissions

Super Admin memiliki akses penuh ke semua fitur:

### User Management
- ✅ Create users
- ✅ Read user data
- ✅ Update user information
- ✅ Delete users
- ✅ Manage user roles

### Department Management
- ✅ Create departments
- ✅ Read department data
- ✅ Update department information
- ✅ Delete departments
- ✅ Manage department hierarchy

### Role Management
- ✅ Create roles
- ✅ Read role data
- ✅ Update role permissions
- ✅ Delete roles
- ✅ Assign roles to users

### Attendance Management
- ✅ View all attendance records
- ✅ Modify attendance data
- ✅ Generate attendance reports
- ✅ Manage attendance policies

### Request Management
- ✅ View all requests (leave, permission, work letters)
- ✅ Approve/reject requests
- ✅ Modify request data
- ✅ Generate request reports

### System Administration
- ✅ Access system settings
- ✅ View audit logs
- ✅ Backup/restore data
- ✅ Monitor system performance
- ✅ Manage application configuration

## Login Instructions

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to login page**:
   ```
   http://localhost:3000/auth/signin
   ```

3. **Enter credentials**:
   - Email: `superadmin@company.com`
   - Password: `SuperAdmin123!`

4. **Access admin panel**:
   ```
   http://localhost:3000/admin
   ```

## Security Best Practices

### 1. **Change Default Password**
⚠️ **IMPORTANT**: Segera ganti password default setelah login pertama kali.

1. Login ke sistem
2. Go to Profile Settings
3. Change Password
4. Use strong password (min 12 characters, mixed case, numbers, symbols)

### 2. **Secure Email Configuration**
- Gunakan email domain perusahaan
- Pastikan email dapat menerima notifikasi sistem
- Aktifkan 2FA jika tersedia

### 3. **Regular Security Checks**
- Review audit logs secara berkala
- Monitor admin activities
- Update permissions sesuai kebutuhan
- Backup data secara rutin

### 4. **Access Control**
- Limit admin access ke IP tertentu jika memungkinkan
- Use VPN untuk akses remote
- Log out setelah selesai menggunakan sistem

## Troubleshooting

### Issue: "User already exists"
**Solution**:
```bash
# Check existing admin users
npm run list-admins

# If needed, reset password
npm run reset-super-admin
```

### Issue: "Role not found"
**Solution**:
```bash
# Seed roles first
npm run db:seed-roles

# Then create super admin
npm run setup-admin
```

### Issue: "Database connection error"
**Solution**:
1. Check database is running
2. Verify DATABASE_URL in .env
3. Run database migrations:
   ```bash
   npm run db:push
   ```

### Issue: "Permission denied"
**Solution**:
1. Verify user has Super Admin role
2. Check role permissions in database
3. Clear browser cache and cookies
4. Try logging out and back in

## Advanced Configuration

### Custom Super Admin Setup
Edit `scripts/setup-super-admin.ts` untuk kustomisasi:

```typescript
const CUSTOM_CONFIG = {
  nip: 'YOUR_NIP',
  name: 'Your Name',
  email: 'your.email@company.com',
  password: 'YourSecurePassword123!',
  phone: '+62XXXXXXXXXX'
};
```

### Environment-Specific Setup
Untuk environment yang berbeda, buat konfigurasi terpisah:

```bash
# Development
npm run setup-admin

# Staging
npm run setup-admin-demo

# Production
# Use custom configuration with secure credentials
```

## Monitoring & Maintenance

### 1. **Regular Checks**
- Monitor admin login activities
- Review user creation/modification logs
- Check system performance metrics
- Verify backup integrity

### 2. **Audit Logs**
Super Admin activities dicatat dalam audit logs:
- User management actions
- Role/permission changes
- System configuration updates
- Login/logout activities

### 3. **Backup Strategy**
- Daily database backups
- Weekly full system backups
- Test restore procedures regularly
- Store backups securely

## Support & Documentation

### Related Documentation
- [Admin User Management](./ADMIN_USER_MANAGEMENT.md)
- [Role & Permission System](./ROLES_PERMISSIONS.md)
- [Security Guidelines](./SECURITY.md)
- [API Documentation](./API.md)

### Getting Help
1. Check this documentation first
2. Review audit logs for error details
3. Check application logs
4. Contact system administrator

## Script Reference

### Available Commands
```bash
# Setup & Creation
npm run setup-admin          # Setup default Super Admin
npm run setup-admin-demo     # Setup demo Super Admin
npm run create-super-admin   # Alternative creation method

# Management
npm run list-admins          # List all admin users
npm run reset-super-admin    # Reset Super Admin password

# Database
npm run db:seed-roles        # Seed roles and departments
npm run db:push              # Push database schema
```

### Script Locations
- `scripts/setup-super-admin.ts` - Main setup script
- `scripts/create-super-admin.ts` - Alternative creation script
- `scripts/seed-roles-departments.ts` - Role seeding script

---

**⚠️ Security Notice**: Always change default passwords in production environments and follow security best practices for admin account management.
