import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, VerifiedStatus } from '../entities/User.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(VerifiedStatus)
  verifiedStatus?: VerifiedStatus;

  @IsOptional()
  emailVerified?: boolean;

  @IsOptional()
  phoneVerified?: boolean;
}

