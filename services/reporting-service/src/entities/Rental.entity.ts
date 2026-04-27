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
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId!: string;

  @Column({ type: 'uuid', name: 'renter_user_id' })
  renterUserId!: string;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'expected_end_date' })
  expectedEndDate!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_end_date' })
  actualEndDate!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'deposit_amount' })
  depositAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_cost' })
  totalCost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'penalty_amount' })
  penaltyAmount!: number;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.ACTIVE,
  })
  status!: RentalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Penalty, (penalty) => penalty.rental)
  penalties!: Penalty[];
}

