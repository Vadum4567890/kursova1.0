import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Review, ReviewStatus } from '../entities/Review.entity';

export class ReviewRepository {
  private repository: Repository<Review>;

  constructor() {
    this.repository = AppDataSource.getRepository(Review);
  }

  async create(data: Partial<Review>): Promise<Review> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findById(id: string): Promise<Review | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['scores'],
    });
  }

  async findByBookingId(bookingId: string): Promise<Review[]> {
    return await this.repository.find({
      where: { bookingId },
      relations: ['scores'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByBookingAndReviewer(bookingId: string, reviewerUserId: string): Promise<Review | null> {
    return await this.repository.findOne({
      where: { bookingId, reviewerUserId },
      relations: ['scores'],
    });
  }

  async update(id: string, data: Partial<Review>): Promise<Review> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Review not found after update');
    }
    return updated;
  }

  async findPublishedByCarId(carId: string): Promise<Review[]> {
    return await this.repository.find({
      where: { carId, status: ReviewStatus.PUBLISHED },
      relations: ['scores'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findPublishedByReviewee(userId: string, revieweeType?: 'owner' | 'renter'): Promise<Review[]> {
    return await this.repository.find({
      where: revieweeType
        ? { revieweeUserId: userId, revieweeType: revieweeType as any, status: ReviewStatus.PUBLISHED }
        : { revieweeUserId: userId, status: ReviewStatus.PUBLISHED },
      relations: ['scores'],
      order: { publishedAt: 'DESC' },
    });
  }
}
