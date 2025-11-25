import { CarType, CarStatus } from '../../models/Car.entity';

/**
 * DTO for creating a new car
 */
export interface CreateCarDto {
  brand: string;
  model: string;
  year: number;
  type: CarType;
  pricePerDay: number;
  deposit: number;
  status?: CarStatus;
  description?: string;
  imageUrl?: string;
  imageUrls?: string | string[];
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string | string[];
}

/**
 * DTO for updating a car
 */
export interface UpdateCarDto {
  brand?: string;
  model?: string;
  year?: number;
  type?: CarType;
  pricePerDay?: number;
  deposit?: number;
  status?: CarStatus;
  description?: string;
  imageUrl?: string;
  imageUrls?: string | string[];
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string | string[];
}

/**
 * DTO for filtering/searching cars
 */
export interface CarFilterDto {
  brand?: string;
  model?: string;
  type?: CarType;
  status?: CarStatus;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
}

