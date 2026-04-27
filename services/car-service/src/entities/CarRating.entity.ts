import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('car_ratings')
export class CarRating {
  @PrimaryColumn('uuid', { name: 'car_id' })
  carId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'integer', default: 0 })
  reviewsCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  cleanlinessAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  technicalConditionAvg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  accuracyOfDescriptionAvg: number;

  @Column({ type: 'integer', default: 0 })
  completedRentalsCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
