import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateRentalDto {
  @IsUUID()
  carId: string;

  @IsUUID()
  renterUserId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  expectedEndDate: string;
}

export class CompleteRentalDto {
  @IsOptional()
  @IsDateString()
  actualEndDate?: string;
}
