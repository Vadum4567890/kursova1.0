import { CarType, CarStatus } from '../../models/Car.entity';

/**
 * DTO for car response (without relations)
 */
export interface CarResponseDto {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: CarType;
  pricePerDay: number;
  deposit: number;
  status: CarStatus;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for car with rental count
 */
export interface CarWithStatsDto extends CarResponseDto {
  rentalCount?: number;
  totalRevenue?: number;
}

