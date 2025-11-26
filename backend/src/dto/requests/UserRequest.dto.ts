import { UserRole } from '../../models/User.entity';

/**
 * DTO for user registration
 */
export interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
  phone?: string;
  role?: UserRole;
}

/**
 * DTO for user login
 */
export interface LoginUserDto {
  usernameOrEmail: string;
  password: string;
}

/**
 * DTO for updating user profile
 */
export interface UpdateProfileDto {
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
}

/**
 * DTO for changing password
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * DTO for updating user role
 */
export interface UpdateUserRoleDto {
  role: UserRole;
}

/**
 * DTO for updating user status
 */
export interface UpdateUserStatusDto {
  isActive: boolean;
}

/**
 * DTO for updating user
 */
export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  password?: string;
}

