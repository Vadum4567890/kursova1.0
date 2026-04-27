import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
} from 'class-validator';
import { CarCategory, TransmissionType, FuelType, CarStatus } from '../entities/Car.entity';

export class SearchCarsDto {
  @IsOptional()
  @IsEnum(CarCategory)
  category?: CarCategory;

  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  features?: string; // Comma-separated list

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;

  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  /** Сторінка пагінації (1-based); разом з limit задає offset = (page - 1) * limit */
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

