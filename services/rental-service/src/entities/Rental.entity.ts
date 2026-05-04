import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Penalty } from './Penalty.entity';

export enum RentalStatus {
  /** Бронь з майбутньою датою початку (ще не в прокаті) */
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RentalOwnerApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RentalReviewStatus {
  NOT_AVAILABLE = 'not_available',
  WAITING = 'waiting',
  PARTIAL = 'partial',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
}

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({ type: 'uuid', name: 'renter_user_id' })
  renterUserId: string;

  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true })
  ownerUserId: string | null;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'expected_end_date' })
  expectedEndDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_end_date' })
  actualEndDate: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'deposit_amount' })
  depositAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_cost' })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'penalty_amount' })
  penaltyAmount: number;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.ACTIVE,
  })
  status: RentalStatus;

  @Column({
    type: 'enum',
    enum: RentalOwnerApprovalStatus,
    name: 'owner_approval_status',
    default: RentalOwnerApprovalStatus.PENDING,
  })
  ownerApprovalStatus: RentalOwnerApprovalStatus;

  @Column({
    type: 'enum',
    enum: RentalReviewStatus,
    name: 'review_status',
    default: RentalReviewStatus.NOT_AVAILABLE,
  })
  reviewStatus: RentalReviewStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'review_window_closes_at' })
  reviewWindowClosesAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'owner_review_submitted_at' })
  ownerReviewSubmittedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'renter_review_submitted_at' })
  renterReviewSubmittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Penalty, (penalty) => penalty.rental)
  penalties: Penalty[];
}
