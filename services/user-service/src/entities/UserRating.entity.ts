import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('user_ratings')
export class UserRating {
  @PrimaryColumn('uuid')
  userId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'integer', default: 0 })
  reviewsCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  asRenterRating: number;

  @Column({ type: 'integer', default: 0 })
  asRenterCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  asOwnerRating: number;

  @Column({ type: 'integer', default: 0 })
  asOwnerCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ownerCommunicationAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ownerHonestyAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ownerResponseSpeedAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  renterReturnedOnTimeAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  renterDamageFreeReturnAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  renterBehaviorAvg: number;

  @Column({ type: 'integer', default: 0 })
  completedRentalsCount: number;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.rating, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

