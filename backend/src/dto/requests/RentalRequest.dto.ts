import { RentalStatus } from '../../models/Rental.entity';

/**
 * DTO for creating a new rental
 */
export interface CreateRentalDto {
  clientId: number;
  carId: number;
  startDate: Date | string;
  expectedEndDate: Date | string;
}

/**
 * DTO for completing a rental
 */
export interface CompleteRentalDto {
  actualEndDate?: Date | string;
}

/**
 * DTO for cancelling a rental
 */
export interface CancelRentalDto {
  cancellationDate?: Date | string;
  reason?: string;
}

/**
 * DTO for filtering/searching rentals
 */
export interface RentalFilterDto {
  clientId?: number;
  carId?: number;
  status?: RentalStatus;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * DTO for creating booking for user
 */
export interface CreateBookingDto {
  carId: number;
  startDate: Date | string;
  expectedEndDate: Date | string;
}

