import { User, Role, Department, Gender, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  nip?: string;
  name?: string;
  email: string;
  image?: string;
  phone?: string;
  status: UserStatus;
  role?: {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface LoginCredentials {
  identifier: string; // Could be email or NIP
  password: string;
}

// Legacy interface for backward compatibility
export interface EmailLoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  nip?: string;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface AuthError {
  type: 'CredentialsSignin' | 'EmailSignin' | 'OAuthSignin' | 'CallbackError';
  message: string;
}

// Permission types
export type Permission =
  | 'user.read' | 'user.write' | 'user.delete'
  | 'attendance.read' | 'attendance.write'
  | 'request.read' | 'request.write' | 'request.approve'
  | 'report.read' | 'report.export'
  | 'admin.system' | 'admin.users' | 'admin.departments';

export interface UserPermissions {
  [key: string]: boolean;
}

// Role permissions structure (matches database JSON structure)
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
  roles?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  attendance?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  requests?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    approve?: boolean;
  };
  reports?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    export?: boolean;
  };
  settings?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  audit?: {
    read?: boolean;
  };
  system?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    backup?: boolean;
    restore?: boolean;
  };

  // Team/supervisor permissions
  team_attendance?: {
    read?: boolean;
    update?: boolean;
  };
  team_reports?: {
    read?: boolean;
    export?: boolean;
  };
  department_reports?: {
    read?: boolean;
    export?: boolean;
  };
  approvals?: {
    read?: boolean;
    approve?: boolean;
  };

  // Legacy format support (for backward compatibility)
  [key: string]: any;
}

// Session user interface
export interface SessionUser {
  id: string;
  nip?: string;
  name?: string;
  email: string;
  image?: string;
  phone?: string;
  status: UserStatus;
  role?: {
    id: string;
    name: string;
    permissions: RolePermissions;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

// Fungsi helper untuk mendeteksi tipe identifier (email/nip/unknown)
export function getIdentifierType(identifier: string): 'email' | 'nip' | 'unknown' {
  // Email regex sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // NIP: 10-20 digit (atau sesuai kebutuhan, bisa 18 digit)
  const nipRegex = /^\d{10,20}$/;

  if (emailRegex.test(identifier)) return 'email';
  if (nipRegex.test(identifier)) return 'nip';
  return 'unknown';
}
