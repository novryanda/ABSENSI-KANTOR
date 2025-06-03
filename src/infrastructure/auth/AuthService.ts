import { IAuthService } from '../../domain/services/IAuthService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthenticateUserUseCase } from '../../use-cases/auth/AuthenticateUser';
import { RegisterUserUseCase } from '../../use-cases/auth/RegisterUser';
import { GetUserPermissionsUseCase } from '../../use-cases/auth/GetUserPermissions';
import { LoginCredentials, EmailLoginCredentials, RegisterData, AuthUser, getIdentifierType } from '../../types/auth';
import { UserEntity } from '../../domain/entities/User';

export class AuthService implements IAuthService {
  private authenticateUserUseCase: AuthenticateUserUseCase;
  private registerUserUseCase: RegisterUserUseCase;
  private getUserPermissionsUseCase: GetUserPermissionsUseCase;

  constructor(private userRepository: IUserRepository) {
    this.authenticateUserUseCase = new AuthenticateUserUseCase(userRepository);
    this.registerUserUseCase = new RegisterUserUseCase(userRepository);
    this.getUserPermissionsUseCase = new GetUserPermissionsUseCase(userRepository);
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Convert identifier to email format for the use case
    const identifierType = getIdentifierType(credentials.identifier);

    let emailCredentials: EmailLoginCredentials;

    if (identifierType === 'email') {
      emailCredentials = {
        email: credentials.identifier,
        password: credentials.password
      };
    } else if (identifierType === 'nip') {
      // Find user by NIP first to get email
      const user = await this.userRepository.findByNIP(credentials.identifier);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      emailCredentials = {
        email: user.email,
        password: credentials.password
      };
    } else {
      throw new Error('Invalid identifier format');
    }

    // Pastikan error dilemparkan jika login gagal
    const user = await this.authenticateUserUseCase.execute(emailCredentials);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async register(data: RegisterData): Promise<UserEntity> {
    return this.registerUserUseCase.execute(data);
  }

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    try {
      const authUser = await this.authenticateUserUseCase.execute({ email, password });
      if (!authUser) return null;
      return this.userRepository.findById(authUser.id);
    } catch (error) {
      return null;
    }
  }

  async getUserPermissions(userId: string): Promise<Record<string, boolean>> {
    return this.getUserPermissionsUseCase.execute(userId);
  }

  async refreshUserSession(userId: string): Promise<AuthUser> {
    const userWithDetails = await this.userRepository.findWithRoleAndDepartment(userId);
    if (!userWithDetails) {
      throw new Error('User not found');
    }

    return {
      id: userWithDetails.id,
      nip: userWithDetails.nip,
      name: userWithDetails.name,
      email: userWithDetails.email,
      image: null,
      phone: userWithDetails.phone,
      status: userWithDetails.status,
      role: userWithDetails.role || undefined,
      department: userWithDetails.department || undefined,
    };
  }
}
