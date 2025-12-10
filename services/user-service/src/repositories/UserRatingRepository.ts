import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { UserRating } from '../entities/UserRating.entity';
import { IUserRatingRepository } from '../interfaces/IUserRatingRepository';

export class UserRatingRepository implements IUserRatingRepository {
  private repository: Repository<UserRating>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserRating);
  }

  async findByUserId(userId: string): Promise<UserRating | null> {
    return await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(ratingData: Partial<UserRating>): Promise<UserRating> {
    const rating = this.repository.create(ratingData);
    return await this.repository.save(rating);
  }

  async update(userId: string, ratingData: Partial<UserRating>): Promise<UserRating | null> {
    await this.repository.update(userId, ratingData);
    return await this.findByUserId(userId);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.repository.delete(userId);
    return (result.affected ?? 0) > 0;
  }

  async updateRating(userId: string, newRating: number, asRenter: boolean): Promise<UserRating | null> {
    const rating = await this.findByUserId(userId);
    if (!rating) {
      return null;
    }

    if (asRenter) {
      const totalRating = rating.asRenterRating * rating.asRenterCount + newRating;
      rating.asRenterCount += 1;
      rating.asRenterRating = totalRating / rating.asRenterCount;
    } else {
      const totalRating = rating.asOwnerRating * rating.asOwnerCount + newRating;
      rating.asOwnerCount += 1;
      rating.asOwnerRating = totalRating / rating.asOwnerCount;
    }

    // Recalculate overall rating
    const totalReviews = rating.asRenterCount + rating.asOwnerCount;
    const totalRating = rating.asRenterRating * rating.asRenterCount + 
                       rating.asOwnerRating * rating.asOwnerCount;
    rating.rating = totalRating / totalReviews;
    rating.reviewsCount = totalReviews;

    return await this.repository.save(rating);
  }
}

