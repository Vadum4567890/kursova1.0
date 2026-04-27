import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Car } from './Car.entity';

@Entity('car_availability')
@Unique(['carId', 'date'])
export class CarAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true, name: 'blocked_reason' })
  blockedReason: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'blocked_by' })
  blockedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Car, (car) => car.availability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car: Car;
}

