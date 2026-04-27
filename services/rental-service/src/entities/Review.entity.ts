import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReviewScore } from './ReviewScore.entity';

export enum ReviewType {
  OWNER_TO_RENTER = 'owner_to_renter',
  RENTER_TO_OWNER_AND_CAR = 'renter_to_owner_and_car',
}

export enum RevieweeType {
  OWNER = 'owner',
  RENTER = 'renter',
}

export enum ReviewStatus {
  SUBMITTED = 'submitted',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId: string;

  @Column({ type: 'uuid', name: 'reviewer_user_id' })
  reviewerUserId: string;

  @Column({ type: 'uuid', name: 'reviewee_user_id' })
  revieweeUserId: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({ type: 'enum', enum: ReviewType, name: 'review_type' })
  reviewType: ReviewType;

  @Column({ type: 'enum', enum: RevieweeType, name: 'reviewee_type' })
  revieweeType: RevieweeType;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.SUBMITTED })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'timestamp', name: 'submitted_at' })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReviewScore, (score) => score.review, { cascade: true })
  scores: ReviewScore[];
}
