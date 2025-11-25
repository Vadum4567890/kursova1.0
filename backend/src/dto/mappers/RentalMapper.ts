import { Rental, RentalStatus } from '../../models/Rental.entity';
import { CreateRentalDto, CompleteRentalDto, CancelRentalDto } from '../requests/RentalRequest.dto';
import { RentalResponseDto, RentalLightResponseDto } from '../responses/RentalResponse.dto';
import { CarMapper } from './CarMapper';
import { ClientMapper } from './ClientMapper';
import { PenaltyMapper } from './PenaltyMapper';

/**
 * Mapper for converting between Rental Entity and DTOs
 */
export class RentalMapper {
  /**
   * Convert Entity to Response DTO (with full relations)
   */
  static toResponseDto(rental: Rental): RentalResponseDto {
    return {
      id: rental.id,
      client: ClientMapper.toResponseDto(rental.client),
      car: CarMapper.toResponseDto(rental.car),
      startDate: rental.startDate,
      expectedEndDate: rental.expectedEndDate,
      actualEndDate: rental.actualEndDate,
      depositAmount: Number(rental.depositAmount),
      totalCost: Number(rental.totalCost),
      penaltyAmount: Number(rental.penaltyAmount),
      status: rental.status,
      penalties: rental.penalties ? PenaltyMapper.toResponseDtoList(rental.penalties) : undefined,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
    };
  }

  /**
   * Convert Entity to Light Response DTO (without full relations)
   */
  static toLightResponseDto(rental: Rental): RentalLightResponseDto {
    return {
      id: rental.id,
      clientId: rental.client.id,
      clientName: rental.client.fullName,
      carId: rental.car.id,
      carBrand: rental.car.brand,
      carModel: rental.car.model,
      startDate: rental.startDate,
      expectedEndDate: rental.expectedEndDate,
      actualEndDate: rental.actualEndDate,
      depositAmount: Number(rental.depositAmount),
      totalCost: Number(rental.totalCost),
      penaltyAmount: Number(rental.penaltyAmount),
      status: rental.status,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
    };
  }

  /**
   * Convert Create DTO to Entity partial
   */
  static fromCreateDto(dto: CreateRentalDto): Partial<Rental> {
    return {
      startDate: dto.startDate instanceof Date ? dto.startDate : new Date(dto.startDate),
      expectedEndDate: dto.expectedEndDate instanceof Date ? dto.expectedEndDate : new Date(dto.expectedEndDate),
    };
  }

  /**
   * Convert Complete DTO to Entity partial
   */
  static fromCompleteDto(dto: CompleteRentalDto): Partial<Rental> {
    const entity: Partial<Rental> = {
      status: RentalStatus.COMPLETED,
    };

    if (dto.actualEndDate) {
      entity.actualEndDate = dto.actualEndDate instanceof Date 
        ? dto.actualEndDate 
        : new Date(dto.actualEndDate);
    }

    return entity;
  }

  /**
   * Convert Cancel DTO to Entity partial
   */
  static fromCancelDto(dto: CancelRentalDto): Partial<Rental> {
    const entity: Partial<Rental> = {
      status: RentalStatus.CANCELLED,
    };

    if (dto.cancellationDate) {
      entity.actualEndDate = dto.cancellationDate instanceof Date 
        ? dto.cancellationDate 
        : new Date(dto.cancellationDate);
    }

    return entity;
  }

  /**
   * Convert multiple entities to response DTOs
   */
  static toResponseDtoList(rentals: Rental[]): RentalResponseDto[] {
    return rentals.map(rental => this.toResponseDto(rental));
  }

  /**
   * Convert multiple entities to light response DTOs
   */
  static toLightResponseDtoList(rentals: Rental[]): RentalLightResponseDto[] {
    return rentals.map(rental => this.toLightResponseDto(rental));
  }
}

