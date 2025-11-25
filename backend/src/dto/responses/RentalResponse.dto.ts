import { RentalStatus } from '../../models/Rental.entity';
import { CarResponseDto } from './CarResponse.dto';
import { ClientResponseDto } from './ClientResponse.dto';
import { PenaltyResponseDto } from './PenaltyResponse.dto';

/**
 * DTO for rental response (with relations)
 */
export interface RentalResponseDto {
  id: number;
  client: ClientResponseDto;
  car: CarResponseDto;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  depositAmount: number;
  totalCost: number;
  penaltyAmount: number;
  status: RentalStatus;
  penalties?: PenaltyResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for rental without full relations (lightweight)
 */
export interface RentalLightResponseDto {
  id: number;
  clientId: number;
  clientName: string;
  carId: number;
  carBrand: string;
  carModel: string;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  depositAmount: number;
  totalCost: number;
  penaltyAmount: number;
  status: RentalStatus;
  createdAt: Date;
  updatedAt: Date;
}

