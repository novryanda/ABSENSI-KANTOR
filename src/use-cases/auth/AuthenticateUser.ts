import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
import { EmailLoginCredentials, AuthUser } from '../../types/auth';

export class AuthenticateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(credentials: EmailLoginCredentials): Promise<AuthUser> {
    // Validate input
    if (!UserEntity.validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (!credentials.password || credentials.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user can login
    if (!user.canLogin()) {
      throw new Error('Account is not active or password not set');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(credentials.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.updateLastLogin();
    await this.userRepository.update(user);

    // Get user with role and department
    const userWithDetails = await this.userRepository.findWithRoleAndDepartment(user.id);
    if (!userWithDetails) {
      throw new Error('User details not found');
    }

    // Return auth user
    return {
      id: user.id,
      nip: user.nip,
      name: user.name,
      email: user.email,
      image: null, // Will be set from session/OAuth
      phone: user.phone,
      status: user.status,
      role: userWithDetails.role || undefined,
      department: userWithDetails.department || undefined,
    };
  }
}
