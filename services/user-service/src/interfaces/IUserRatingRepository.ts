import { UserRating } from '../entities/UserRating.entity';

export interface IUserRatingRepository {
  findByUserId(userId: string): Promise<UserRating | null>;
  create(ratingData: Partial<UserRating>): Promise<UserRating>;
  update(userId: string, ratingData: Partial<UserRating>): Promise<UserRating | null>;
  delete(userId: string): Promise<boolean>;
  updateRating(userId: string, newRating: number, asRenter: boolean): Promise<UserRating | null>;
}

