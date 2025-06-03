import { UserEntity } from '../entities/User';
import { LoginCredentials, RegisterData, AuthUser } from '../../types/auth';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  register(data: RegisterData): Promise<UserEntity>;
  validateUser(email: string, password: string): Promise<UserEntity | null>;
  getUserPermissions(userId: string): Promise<Record<string, boolean>>;
  refreshUserSession(userId: string): Promise<AuthUser>;
}
