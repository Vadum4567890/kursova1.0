import { BaseRepository } from './BaseRepository';
import { User } from '../models/User.entity';
import { IUserRepository } from '../core/interfaces/IUserRepository';

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super(User);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    return await this.repository
      .createQueryBuilder('user')
      .where('user.username = :usernameOrEmail', { usernameOrEmail })
      .orWhere('user.email = :usernameOrEmail', { usernameOrEmail })
      .getOne();
  }
}

// Ensure UserRepository implements IUserRepository interface

