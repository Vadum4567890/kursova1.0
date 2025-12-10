import {
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsString,
  Length,
} from 'class-validator';

export class CreatePricingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  dailyRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRate?: number;

  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

