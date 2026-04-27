import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole, VerifiedStatus } from '../entities/User.entity';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(VerifiedStatus)
  @IsOptional()
  verifiedStatus?: VerifiedStatus;
}

