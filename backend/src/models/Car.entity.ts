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
  imageUrl?: string;

  @OneToMany(() => Rental, (rental) => rental.car)
  rentals!: Rental[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

