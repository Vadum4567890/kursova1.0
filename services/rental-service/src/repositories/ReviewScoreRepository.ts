import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { ReviewScore } from '../entities/ReviewScore.entity';

export class ReviewScoreRepository {
  private repository: Repository<ReviewScore>;

  constructor() {
    this.repository = AppDataSource.getRepository(ReviewScore);
  }

  async createMany(scores: Array<Partial<ReviewScore>>): Promise<ReviewScore[]> {
    const entities = this.repository.create(scores);
    return await this.repository.save(entities);
  }

  async replaceForReview(reviewId: string, scores: Array<Partial<ReviewScore>>): Promise<ReviewScore[]> {
    await this.repository.delete({ reviewId });
    return this.createMany(scores);
  }
}
