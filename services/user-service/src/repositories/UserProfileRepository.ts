import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { UserProfile } from '../entities/UserProfile.entity';
import { IUserProfileRepository } from '../interfaces/IUserProfileRepository';

export class UserProfileRepository implements IUserProfileRepository {
  private repository: Repository<UserProfile>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserProfile);
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const profile = this.repository.create(profileData);
    return await this.repository.save(profile);
  }

  async update(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    await this.repository.update(userId, profileData);
    return await this.findByUserId(userId);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.repository.delete(userId);
    return (result.affected ?? 0) > 0;
  }
}

