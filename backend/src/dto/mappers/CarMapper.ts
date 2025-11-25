import { Car, CarType, CarStatus } from '../../models/Car.entity';
import { CreateCarDto, UpdateCarDto } from '../requests/CarRequest.dto';
import { CarResponseDto } from '../responses/CarResponse.dto';

/**
 * Mapper for converting between Car Entity and DTOs
 */
export class CarMapper {
  /**
   * Convert Entity to Response DTO
   */
  static toResponseDto(car: Car): CarResponseDto {
    // Parse imageUrls if it's a string
    let imageUrls: string[] = [];
    if (car.imageUrls) {
      if (typeof car.imageUrls === 'string') {
        try {
          imageUrls = JSON.parse(car.imageUrls);
        } catch {
          // If not valid JSON, treat as single image
          imageUrls = [car.imageUrls];
        }
      } else if (Array.isArray(car.imageUrls)) {
        imageUrls = car.imageUrls;
      }
    } else if (car.imageUrl) {
      imageUrls = [car.imageUrl];
    }

    // Parse features if it's a string
    let features: string[] = [];
    if (car.features) {
      if (typeof car.features === 'string') {
        try {
          features = JSON.parse(car.features);
        } catch {
          // If not valid JSON, treat as comma-separated
          features = car.features.split(',').map(f => f.trim());
        }
      } else if (Array.isArray(car.features)) {
        features = car.features;
      }
    }

    return {
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      type: car.type,
      pricePerDay: Number(car.pricePerDay),
      deposit: Number(car.deposit),
      status: car.status,
      description: car.description,
      imageUrl: car.imageUrl,
      imageUrls,
      bodyType: car.bodyType,
      driveType: car.driveType,
      transmission: car.transmission,
      engine: car.engine,
      fuelType: car.fuelType,
      seats: car.seats,
      mileage: car.mileage,
      color: car.color,
      features,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };
  }

  /**
   * Convert Create DTO to Entity partial
   */
  static fromCreateDto(dto: CreateCarDto): Partial<Car> {
    const entity: Partial<Car> = {
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      type: dto.type,
      pricePerDay: dto.pricePerDay,
      deposit: dto.deposit,
      status: dto.status || CarStatus.AVAILABLE,
      description: dto.description,
      imageUrl: dto.imageUrl,
      bodyType: dto.bodyType,
      driveType: dto.driveType,
      transmission: dto.transmission,
      engine: dto.engine,
      fuelType: dto.fuelType,
      seats: dto.seats,
      mileage: dto.mileage,
      color: dto.color,
    };

    // Handle imageUrls
    if (dto.imageUrls) {
      if (Array.isArray(dto.imageUrls)) {
        entity.imageUrls = JSON.stringify(dto.imageUrls);
      } else {
        entity.imageUrls = dto.imageUrls;
      }
    }

    // Handle features
    if (dto.features) {
      if (Array.isArray(dto.features)) {
        entity.features = JSON.stringify(dto.features);
      } else {
        entity.features = dto.features;
      }
    }

    return entity;
  }

  /**
   * Convert Update DTO to Entity partial
   */
  static fromUpdateDto(dto: UpdateCarDto): Partial<Car> {
    const entity: Partial<Car> = {};

    if (dto.brand !== undefined) entity.brand = dto.brand;
    if (dto.model !== undefined) entity.model = dto.model;
    if (dto.year !== undefined) entity.year = dto.year;
    if (dto.type !== undefined) entity.type = dto.type;
    if (dto.pricePerDay !== undefined) entity.pricePerDay = dto.pricePerDay;
    if (dto.deposit !== undefined) entity.deposit = dto.deposit;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.imageUrl !== undefined) entity.imageUrl = dto.imageUrl;
    if (dto.bodyType !== undefined) entity.bodyType = dto.bodyType;
    if (dto.driveType !== undefined) entity.driveType = dto.driveType;
    if (dto.transmission !== undefined) entity.transmission = dto.transmission;
    if (dto.engine !== undefined) entity.engine = dto.engine;
    if (dto.fuelType !== undefined) entity.fuelType = dto.fuelType;
    if (dto.seats !== undefined) entity.seats = dto.seats;
    if (dto.mileage !== undefined) entity.mileage = dto.mileage;
    if (dto.color !== undefined) entity.color = dto.color;

    // Handle imageUrls
    if (dto.imageUrls !== undefined) {
      if (Array.isArray(dto.imageUrls)) {
        entity.imageUrls = JSON.stringify(dto.imageUrls);
      } else {
        entity.imageUrls = dto.imageUrls;
      }
    }

    // Handle features
    if (dto.features !== undefined) {
      if (Array.isArray(dto.features)) {
        entity.features = JSON.stringify(dto.features);
      } else {
        entity.features = dto.features;
      }
    }

    return entity;
  }

  /**
   * Convert multiple entities to response DTOs
   */
  static toResponseDtoList(cars: Car[]): CarResponseDto[] {
    return cars.map(car => this.toResponseDto(car));
  }
}

