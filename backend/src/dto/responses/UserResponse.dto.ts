import { UserRole } from '../../models/User.entity';

/**
 * DTO for user response (without password)
 */
export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for authentication response
 */
export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
}

