import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Rental } from './Rental.entity';

export enum CarType {
  ECONOMY = 'economy',
  BUSINESS = 'business',
  PREMIUM = 'premium',
}

export enum CarStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
}

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  brand!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;

  @Column({
    type: 'enum',
    enum: CarType,
    default: CarType.ECONOMY,
  })
  type!: CarType;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerDay!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  deposit!: number;

  @Column({
    type: 'enum',
    enum: CarStatus,
    default: CarStatus.AVAILABLE,
  })
  status!: CarStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string; // Main image (for backward compatibility)

  @Column({ type: 'text', nullable: true })
  imageUrls?: string; // Multiple images (JSON array stored as text)

  // Additional car specifications (optional)
  @Column({ nullable: true })
  bodyType?: string; // sedan, hatchback, suv, coupe, etc.

  @Column({ nullable: true })
  driveType?: string; // front-wheel, rear-wheel, all-wheel

  @Column({ nullable: true })
  transmission?: string; // manual, automatic, cvt

  @Column({ nullable: true })
  engine?: string; // 1.4, 2.0, etc.

  @Column({ nullable: true })
  fuelType?: string; // gasoline, diesel, hybrid, electric

  @Column({ nullable: true, type: 'int' })
  seats?: number;

  @Column({ nullable: true, type: 'int' })
  mileage?: number; // in km

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true, type: 'text' })
  features?: string; // JSON string or comma-separated features

  @OneToMany(() => Rental, (rental) => rental.car)
  rentals!: Rental[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

