import { Tables, Enums } from './database.types'
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// ============================================================================
// DOMAIN TYPES (extend dari Supabase types)
// ============================================================================

export type UserProfile = Tables<'users'> & {
    role?: Tables<'roles'> | null
    department?: Tables<'departments'> | null
    userLeaveBalances?: Array<Tables<'user_leave_balances'> & {
        leaveType: Tables<'leave_type_configs'>
    }>
}

export type UserStatus = Enums<'user_status'>
export type Gender = Enums<'gender'>

// ============================================================================
// NEXT-AUTH TYPE EXTENSIONS
// ============================================================================

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            nip?: string | null
            role?: {
                id: string
                name: string
                permissions: RolePermissions
            } | null
            department?: {
                id: string
                name: string
                code: string
            } | null
            status: UserStatus
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        nip?: string | null
        role?: {
            id: string
            name: string
            permissions: RolePermissions
        } | null
        department?: {
            id: string
            name: string
            code: string
        } | null
        status: UserStatus
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        nip?: string | null
        role?: {
            id: string
            name: string
            permissions: RolePermissions
        } | null
        department?: {
            id: string
            name: string
            code: string
        } | null
        status: UserStatus
    }
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

export interface RolePermissions {
    // User Management
    users?: ("read" | "create" | "update" | "delete")[]

    // Attendance
    attendance?: ("read" | "create" | "update" | "delete")[]
    own_attendance?: ("read" | "create" | "update")[]
    team_attendance?: ("read")[]

    // Requests
    requests?: ("read" | "create" | "update" | "delete")[]
    own_requests?: ("read" | "create" | "update" | "cancel")[]
    team_requests?: ("read")[]

    // Approvals
    approvals?: ("read" | "approve" | "reject")[]

    // Reports
    reports?: ("read" | "create" | "export")[]
    team_reports?: ("read" | "create" | "export")[]
    department_reports?: ("read" | "create" | "export")[]

    // System Administration
    system?: ("read" | "create" | "update" | "delete")[]
    departments?: ("read" | "create" | "update" | "delete")[]
    roles?: ("read" | "create" | "update" | "delete")[]
    settings?: ("read" | "update")[]

    // Special permissions
    all?: boolean
}

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

export interface LoginCredentials {
    nip: string
    password: string
}

export interface RegisterData {
    nip: string
    name: string
    email: string
    password: string
    phone?: string
    birthDate?: string
    gender?: Gender
    address?: string
    hireDate?: string
    departmentId: string
    roleId: string
}

export interface UpdateProfileData {
    name?: string
    email?: string
    phone?: string
    birthDate?: string
    gender?: Gender
    address?: string
    image?: string
}

export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export interface AuthError {
    message: string
    code?: string
    field?: string
}

export interface AuthResponse<T = any> {
    success: boolean
    data?: T
    error?: AuthError
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

export type AuthRole = "Super Admin" | "Admin" | "Atasan" | "Pegawai"

export interface PermissionCheck {
    resource: string
    action: string
    userId?: string
    departmentId?: string
}

export interface SessionUser {
    id: string
    nip?: string | null
    name?: string | null
    email: string
    image?: string | null
    role?: {
        id: string
        name: string
        permissions: RolePermissions
    } | null
    department?: {
        id: string
        name: string
        code: string
    } | null
    status: UserStatus
}

export type IdentifierType = 'nip' | 'email' | 'unknown';

export const getIdentifierType = (identifier: string): IdentifierType => {
    // Basic NIP check (assuming NIP is numeric and has a certain length, e.g., 8-18 digits)
    if (/^\d{8,18}$/.test(identifier)) {
        return 'nip';
    }
    // Basic email check
    if (/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(identifier)) { // Removed redundant escape for .
        return 'email';
    }
    return 'unknown';
};

