import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { CarRating } from '../entities/CarRating.entity';

export class CarRatingRepository {
  private repository: Repository<CarRating>;

  constructor() {
    this.repository = AppDataSource.getRepository(CarRating);
  }

  async findByCarId(carId: string): Promise<CarRating | null> {
    return await this.repository.findOne({ where: { carId } });
  }

  async create(carId: string): Promise<CarRating> {
    const rating = this.repository.create({ carId });
    return await this.repository.save(rating);
  }

  async getOrCreate(carId: string): Promise<CarRating> {
    const existing = await this.findByCarId(carId);
    if (existing) {
      return existing;
    }
    return await this.create(carId);
  }

  async incrementCompletedRentals(carId: string): Promise<CarRating> {
    const rating = await this.getOrCreate(carId);
    rating.completedRentalsCount += 1;
    return await this.repository.save(rating);
  }

  async applyPublishedReviewAggregate(
    carId: string,
    payload: {
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<CarRating> {
    const rating = await this.getOrCreate(carId);
    const currentCount = rating.reviewsCount;
    const mergeAverage = (currentAvg: number, nextValue: number) =>
      ((Number(currentAvg) * currentCount) + nextValue) / (currentCount + 1);

    rating.cleanlinessAvg = mergeAverage(
      Number(rating.cleanlinessAvg),
      Number(payload.categories.cleanliness || 0)
    );
    rating.technicalConditionAvg = mergeAverage(
      Number(rating.technicalConditionAvg),
      Number(payload.categories.technical_condition || 0)
    );
    rating.accuracyOfDescriptionAvg = mergeAverage(
      Number(rating.accuracyOfDescriptionAvg),
      Number(payload.categories.accuracy_of_description || 0)
    );
    rating.rating = mergeAverage(Number(rating.rating), Number(payload.overallScore));
    rating.reviewsCount += 1;

    return await this.repository.save(rating);
  }
}
