import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  fullName?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'employee' | 'user';
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<{ data: User[] }>('/users');
    return response.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<{ data: User }>(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post<{ message: string; data: User }>('/users', data);
    return response.data.data;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get<{ data: User[] }>(`/users/role/${role}`);
    return response.data.data;
  },

  async updateUserRole(id: number, role: string): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}/role`, { role });
    return response.data.data;
  },

  async updateUserStatus(id: number, isActive: boolean): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}/status`, { isActive });
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

