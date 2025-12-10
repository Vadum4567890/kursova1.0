import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Car } from './Car.entity';

@Entity('car_pricing')
export class CarPricing {
  @PrimaryColumn({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'hourly_rate' })
  hourlyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'daily_rate' })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'weekly_rate' })
  weeklyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_rate' })
  monthlyRate: number | null;

  @Column({ type: 'boolean', default: true, name: 'deposit_required' })
  depositRequired: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'deposit_amount' })
  depositAmount: number | null;

  @Column({ type: 'varchar', length: 3, default: 'UAH' })
  currency: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Car, (car) => car.pricing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car: Car;
}

