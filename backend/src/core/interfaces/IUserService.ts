import { User } from '../../models/User.entity';

/**
 * Interface for User Service
 */
export interface UpdateUserData {
  email?: string;
  fullName?: string;
  address?: string;
  password?: string;
}

export interface UpdateUserStatusData {
  isActive: boolean;
}

export interface IUserService {
  getAllUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  updateUser(id: number, data: UpdateUserData): Promise<User>;
  updateUserStatus(id: number, data: UpdateUserStatusData): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  updateUserRole(id: number, data: { role: any }): Promise<User>;
  getUsersByRole(role: any): Promise<User[]>;
}

