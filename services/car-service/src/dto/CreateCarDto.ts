import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  Length,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { CarCategory, TransmissionType, FuelType } from '../entities/Car.entity';

export class CreateCarDto {
  @IsUUID()
  ownerId: string;

  @IsString()
  @Length(1, 100)
  make: string;

  @IsString()
  @Length(1, 100)
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @IsEnum(CarCategory)
  category: CarCategory;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsNumber()
  @Min(2)
  @Max(9)
  seats: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  licensePlate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsLatitude()
  locationLatitude?: number;

  @IsOptional()
  @IsLongitude()
  locationLongitude?: number;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;
}

