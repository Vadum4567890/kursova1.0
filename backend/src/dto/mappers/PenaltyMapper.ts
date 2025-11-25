import { Penalty } from '../../models/Penalty.entity';
import { CreatePenaltyDto, UpdatePenaltyDto } from '../requests/PenaltyRequest.dto';
import { PenaltyResponseDto } from '../responses/PenaltyResponse.dto';
import { RentalMapper } from './RentalMapper';

/**
 * Mapper for converting between Penalty Entity and DTOs
 */
export class PenaltyMapper {
  /**
   * Convert Entity to Response DTO
   */
  static toResponseDto(penalty: Penalty): PenaltyResponseDto {
    return {
      id: penalty.id,
      rentalId: penalty.rental.id,
      rental: penalty.rental ? RentalMapper.toLightResponseDto(penalty.rental) : undefined,
      amount: Number(penalty.amount),
      reason: penalty.reason,
      date: penalty.date,
      createdAt: penalty.createdAt,
    };
  }

  /**
   * Convert Create DTO to Entity partial
   */
  static fromCreateDto(dto: CreatePenaltyDto): Partial<Penalty> {
    return {
      amount: dto.amount,
      reason: dto.reason,
      date: new Date(),
    };
  }

  /**
   * Convert Update DTO to Entity partial
   */
  static fromUpdateDto(dto: UpdatePenaltyDto): Partial<Penalty> {
    const entity: Partial<Penalty> = {};
    
    if (dto.amount !== undefined) entity.amount = dto.amount;
    if (dto.reason !== undefined) entity.reason = dto.reason;

    return entity;
  }

  /**
   * Convert multiple entities to response DTOs
   */
  static toResponseDtoList(penalties: Penalty[]): PenaltyResponseDto[] {
    return penalties.map(penalty => this.toResponseDto(penalty));
  }
}

