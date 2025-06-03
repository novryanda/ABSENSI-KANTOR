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
