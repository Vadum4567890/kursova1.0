import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { UserRating } from '../entities/UserRating.entity';
import { IUserRatingRepository } from '../interfaces/IUserRatingRepository';

export class UserRatingRepository implements IUserRatingRepository {
  private repository: Repository<UserRating>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserRating);
  }

  private async ensureRatingRow(userId: string): Promise<UserRating> {
    const existing = await this.repository.findOne({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const created = this.repository.create({ userId });
    return await this.repository.save(created);
  }

  async findByUserId(userId: string): Promise<UserRating | null> {
    return await this.repository.findOne({
      where: { userId },
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
    const rating = await this.ensureRatingRow(userId);

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

  async incrementCompletedRentals(userId: string): Promise<UserRating | null> {
    const rating = await this.ensureRatingRow(userId);

    rating.completedRentalsCount += 1;
    return await this.repository.save(rating);
  }

  async applyPublishedReviewAggregate(
    userId: string,
    payload: {
      role: 'owner' | 'renter';
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<UserRating | null> {
    const rating = await this.ensureRatingRow(userId);

    const mergeAverage = (currentAvg: number, currentCount: number, nextValue: number) =>
      ((Number(currentAvg) * currentCount) + nextValue) / (currentCount + 1);

    if (payload.role === 'owner') {
      const currentCount = rating.asOwnerCount;
      rating.ownerCommunicationAvg = mergeAverage(
        Number(rating.ownerCommunicationAvg),
        currentCount,
        Number(payload.categories.communication || 0)
      );
      rating.ownerHonestyAvg = mergeAverage(
        Number(rating.ownerHonestyAvg),
        currentCount,
        Number(payload.categories.honesty || 0)
      );
      rating.ownerResponseSpeedAvg = mergeAverage(
        Number(rating.ownerResponseSpeedAvg),
        currentCount,
        Number(payload.categories.response_speed || 0)
      );
      rating.asOwnerRating = mergeAverage(
        Number(rating.asOwnerRating),
        currentCount,
        Number(payload.overallScore)
      );
      rating.asOwnerCount += 1;
    } else {
      const currentCount = rating.asRenterCount;
      rating.renterReturnedOnTimeAvg = mergeAverage(
        Number(rating.renterReturnedOnTimeAvg),
        currentCount,
        Number(payload.categories.returned_on_time || 0)
      );
      rating.renterDamageFreeReturnAvg = mergeAverage(
        Number(rating.renterDamageFreeReturnAvg),
        currentCount,
        Number(payload.categories.damage_free_return || 0)
      );
      rating.renterBehaviorAvg = mergeAverage(
        Number(rating.renterBehaviorAvg),
        currentCount,
        Number(payload.categories.behavior || 0)
      );
      rating.asRenterRating = mergeAverage(
        Number(rating.asRenterRating),
        currentCount,
        Number(payload.overallScore)
      );
      rating.asRenterCount += 1;
    }

    const totalReviews = rating.asOwnerCount + rating.asRenterCount;
    const totalRating =
      Number(rating.asOwnerRating) * rating.asOwnerCount +
      Number(rating.asRenterRating) * rating.asRenterCount;
    rating.rating = totalReviews > 0 ? totalRating / totalReviews : 0;
    rating.reviewsCount = totalReviews;

    return await this.repository.save(rating);
  }
}

