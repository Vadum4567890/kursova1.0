import { UserProfile } from '../entities/UserProfile.entity';

export interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  create(profileData: Partial<UserProfile>): Promise<UserProfile>;
  update(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null>;
  delete(userId: string): Promise<boolean>;
}

