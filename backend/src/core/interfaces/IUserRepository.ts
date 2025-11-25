import { User } from '../../models/User.entity';

/**
 * Interface for User Repository
 */
export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  create(entity: Partial<User>): Promise<User>;
  update(id: number, entity: Partial<User>): Promise<User>;
  delete(id: number): Promise<boolean>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>;
}

