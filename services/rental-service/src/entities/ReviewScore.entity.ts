import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Review } from './Review.entity';

@Entity('review_scores')
@Unique(['reviewId', 'categoryCode'])
export class ReviewScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'review_id' })
  reviewId: string;

  @Column({ type: 'varchar', length: 64, name: 'category_code' })
  categoryCode: string;

  @Column({ type: 'smallint' })
  score: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Review, (review) => review.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;
}
