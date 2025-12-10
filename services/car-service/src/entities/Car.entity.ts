import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CarPricing } from './CarPricing.entity';
import { CarFeature } from './CarFeature.entity';
import { CarAvailability } from './CarAvailability.entity';
import { CarImage } from './CarImage.entity';
import { CarDocument } from './CarDocument.entity';

export enum CarCategory {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  SUV = 'suv',
  LUXURY = 'luxury',
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  CVT = 'cvt',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum CarStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DELETED = 'deleted',
}

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', length: 100 })
  make: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'varchar', length: 17, unique: true, nullable: true })
  vin: string | null;

  @Column({
    type: 'enum',
    enum: CarCategory,
  })
  category: CarCategory;

  @Column({
    type: 'enum',
    enum: TransmissionType,
    name: 'transmission',
  })
  transmission: TransmissionType;

  @Column({
    type: 'enum',
    enum: FuelType,
    name: 'fuel_type',
  })
  fuelType: FuelType;

  @Column({ type: 'integer' })
  seats: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  mileage: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'license_plate' })
  licensePlate: string | null;

  @Column({
    type: 'enum',
    enum: CarStatus,
    default: CarStatus.ACTIVE,
  })
  status: CarStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'location_latitude' })
  locationLatitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true, name: 'location_longitude' })
  locationLongitude: number | null;

  @Column({ type: 'text', nullable: true, name: 'location_address' })
  locationAddress: string | null;

  @Column({ type: 'boolean', default: false, name: 'instant_book' })
  instantBook: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => CarPricing, (pricing) => pricing.car, { cascade: true })
  pricing: CarPricing;

  @OneToMany(() => CarFeature, (feature) => feature.car, { cascade: true })
  features: CarFeature[];

  @OneToMany(() => CarAvailability, (availability) => availability.car, { cascade: true })
  availability: CarAvailability[];

  @OneToMany(() => CarImage, (image) => image.car, { cascade: true })
  images: CarImage[];

  @OneToMany(() => CarDocument, (document) => document.car, { cascade: true })
  documents: CarDocument[];
}

