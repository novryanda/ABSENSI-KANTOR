import { UserStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public name: string | null = null,
    public nip: string | null = null,
    public phone: string | null = null,
    public birthDate: Date | null = null,
    public gender: Gender | null = null,
    public address: string | null = null,
    public hireDate: Date | null = null,
    public status: UserStatus = UserStatus.ACTIVE,
    public departmentId: string | null = null,
    public roleId: string | null = null,
    public passwordHash: string | null = null,
    public latitude: number | null = null,
    public longitude: number | null = null,
    public lastLogin: Date | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  public async setPassword(plainPassword: string): Promise<void> {
    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    this.passwordHash = await bcrypt.hash(plainPassword, 12);
  }

  public async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public updateLastLogin(): void {
    this.lastLogin = new Date();
  }

  public deactivate(): void {
    if (this.status === UserStatus.ACTIVE) {
      this.status = UserStatus.INACTIVE;
    }
  }

  public activate(): void {
    if (this.status === UserStatus.INACTIVE) {
      this.status = UserStatus.ACTIVE;
    }
  }

  public canLogin(): boolean {
    return this.isActive() && this.passwordHash !== null;
  }

  // Validation methods
  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static validateNIP(nip: string): boolean {
    // Example: NIP must be 18 digits
    return /^\d{18}$/.test(nip);
  }

  public static validatePhone(phone: string): boolean {
    // Indonesian phone number format
    return /^(\+62|62|0)[0-9]{9,12}$/.test(phone);
  }
}
