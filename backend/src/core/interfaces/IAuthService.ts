import { UserRole } from '../../models/User.entity';

/**
 * Interface for Auth Service
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    fullName?: string;
    address?: string;
  };
  token: string;
}

export interface IAuthService {
  register(data: RegisterData & { role?: any }): Promise<AuthResponse>;
  login(data: LoginData): Promise<AuthResponse>;
  verifyToken(token: string): any;
  getUserById(userId: number): Promise<any>;
  updateProfile(userId: number, data: { email?: string; fullName?: string; address?: string; phone?: string }): Promise<any>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
}

