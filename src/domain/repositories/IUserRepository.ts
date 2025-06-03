import { UserEntity } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByNIP(nip: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  findWithRoleAndDepartment(id: string): Promise<UserEntity & {
    role?: { id: string; name: string; permissions: Record<string, boolean> };
    department?: { id: string; name: string; code: string };
  } | null>;
}
