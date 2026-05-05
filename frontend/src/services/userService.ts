import api from './api';
import { User, CreateUserData, UserRatingSummary } from '../interfaces';
import axios from 'axios';

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<{ data: User[] }>('/users');
    return response.data.data;
  },

  async getUserById(id: number | string): Promise<User> {
    const response = await api.get<unknown>(`/users/${id}`);
    return unwrapData<User>(response.data);
  },

  async getUserRating(id: number | string): Promise<UserRatingSummary | null> {
    try {
      const response = await api.get<unknown>(`/users/${id}/rating`);
      const raw = unwrapData<any>(response.data);
      if (!raw) {
        return null;
      }

      return {
        userId: String(raw.userId ?? id),
        rating: Number(raw.rating || 0),
        reviewsCount: Number(raw.reviewsCount || 0),
        asRenterRating: Number(raw.asRenterRating || 0),
        asRenterCount: Number(raw.asRenterCount || 0),
        asOwnerRating: Number(raw.asOwnerRating || 0),
        asOwnerCount: Number(raw.asOwnerCount || 0),
        ownerCommunicationAvg: Number(raw.ownerCommunicationAvg || 0),
        ownerHonestyAvg: Number(raw.ownerHonestyAvg || 0),
        ownerResponseSpeedAvg: Number(raw.ownerResponseSpeedAvg || 0),
        renterReturnedOnTimeAvg: Number(raw.renterReturnedOnTimeAvg || 0),
        renterDamageFreeReturnAvg: Number(raw.renterDamageFreeReturnAvg || 0),
        renterBehaviorAvg: Number(raw.renterBehaviorAvg || 0),
        completedRentalsCount: Number(raw.completedRentalsCount || 0),
        updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post<{ message: string; data: User }>('/users', data);
    return response.data.data;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get<{ data: User[] }>(`/users/role/${role}`);
    return response.data.data;
  },

  async updateUserRole(id: number | string, role: string): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}/role`, { role });
    return response.data.data;
  },

  async updateUserStatus(id: number | string, isActive: boolean): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}/status`, { isActive });
    return response.data.data;
  },

  async deleteUser(id: number | string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
