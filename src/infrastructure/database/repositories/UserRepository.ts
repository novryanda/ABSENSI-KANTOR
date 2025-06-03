import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserEntity } from '../../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    return user ? this.toDomain(user) : null;
  }

  async findByNIP(nip: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { nip }
    });

    return user ? this.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone }
    });

    return user ? this.toDomain(user) : null;
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        nip: user.nip,
        phone: user.phone,
        passwordHash: user.passwordHash,
        birthDate: user.birthDate,
        gender: user.gender,
        address: user.address,
        hireDate: user.hireDate,
        status: user.status,
        departmentId: user.departmentId,
        roleId: user.roleId,
        latitude: user.latitude ? Number(user.latitude) : null,
        longitude: user.longitude ? Number(user.longitude) : null,
      }
    });

    return this.toDomain(created);
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        nip: user.nip,
        phone: user.phone,
        passwordHash: user.passwordHash,
        birthDate: user.birthDate,
        gender: user.gender,
        address: user.address,
        hireDate: user.hireDate,
        status: user.status,
        departmentId: user.departmentId,
        roleId: user.roleId,
        latitude: user.latitude ? Number(user.latitude) : null,
        longitude: user.longitude ? Number(user.longitude) : null,
        lastLogin: user.lastLogin,
        updatedAt: new Date(),
      }
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  async findWithRoleAndDepartment(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    if (!user) return null;

    const domainUser = this.toDomain(user);
    return {
      ...domainUser,
      role: user.role,
      department: user.department,
    };
  }

  private toDomain(user: any): UserEntity {
    return new UserEntity(
      user.id,
      user.email,
      user.name,
      user.nip,
      user.phone,
      user.birthDate,
      user.gender,
      user.address,
      user.hireDate,
      user.status,
      user.departmentId,
      user.roleId,
      user.passwordHash,
      user.latitude ? Number(user.latitude) : null,
      user.longitude ? Number(user.longitude) : null,
      user.lastLogin,
      user.createdAt,
      user.updatedAt
    );
  }
}
