import api from './api';

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
  role?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    fullName?: string;
    address?: string;
    phone?: string;
  };
  token: string;
}

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

