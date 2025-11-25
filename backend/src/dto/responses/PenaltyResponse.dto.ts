import { RentalLightResponseDto } from './RentalResponse.dto';

/**
 * DTO for penalty response (with rental info)
 */
export interface PenaltyResponseDto {
  id: number;
  rentalId: number;
  rental?: RentalLightResponseDto;
  amount: number;
  reason: string;
  date: Date;
  createdAt: Date;
}

/**
 * DTO for penalty total
 */
export interface PenaltyTotalDto {
  rentalId: number;
  total: number;
  count: number;
}

