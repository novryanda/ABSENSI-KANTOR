import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
import { RegisterData } from '../../types/auth';
import { UserStatus } from '@prisma/client';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: RegisterData): Promise<UserEntity> {
    // Validate input
    if (!UserEntity.validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.phone && !UserEntity.validatePhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    if (data.nip && !UserEntity.validateNIP(data.nip)) {
      throw new Error('Invalid NIP format');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    if (data.phone) {
      const existingPhone = await this.userRepository.findByPhone(data.phone);
      if (existingPhone) {
        throw new Error('User with this phone already exists');
      }
    }

    if (data.nip) {
      const existingNIP = await this.userRepository.findByNIP(data.nip);
      if (existingNIP) {
        throw new Error('User with this NIP already exists');
      }
    }

    // Create new user
    const user = new UserEntity(
      '', // Will be generated by database
      data.email,
      data.name,
      data.nip,
      data.phone,
      null, // birthDate
      null, // gender
      null, // address
      null, // hireDate
      UserStatus.ACTIVE,
      null, // departmentId
      null  // roleId - will be assigned by admin
    );

    // Set password
    await user.setPassword(data.password);

    // Save user
    return this.userRepository.create(user);
  }
}
