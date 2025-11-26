import api from './api';
import { LoginData, RegisterData, AuthResponse } from '../interfaces';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<{ message: string; data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<{ message: string; data: AuthResponse }>('/auth/register', data);
    return response.data.data;
  },

  async getMe(): Promise<AuthResponse['user']> {
    const response = await api.get<{ data: AuthResponse['user'] }>('/auth/me');
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  async updateProfile(data: { email?: string; fullName?: string; address?: string; phone?: string }): Promise<AuthResponse['user']> {
    const response = await api.put<{ message: string; data: AuthResponse['user'] }>('/auth/profile', data);
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  },
};

