import api from './api';
import { Client } from '../interfaces';

function usersToCustomers(users: any[]): Client[] {
  return users.map((user: any) => ({
    id: user.id,
    fullName: user.fullName || user.username || user.email || `User #${user.id}`,
    phone: user.phone || '-',
    email: user.email,
    address: user.address || 'Не вказано',
    registrationDate: user.createdAt || new Date().toISOString(),
  }));
}

export const customerService = {
  async getAll(): Promise<Client[]> {
    try {
      const response = await api.get<Client[]>('/clients');
      const rows = response.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows;
      }
    } catch {
      // fall through to compatibility fallback
    }

    try {
      const rentersResponse = await api.get<{ data: any[] }>('/users?role=renter');
      return usersToCustomers(rentersResponse.data?.data ?? []);
    } catch {
      return [];
    }
  },

  async getById(id: number | string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async getByPhone(phone: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/phone/${phone}`);
    return response.data;
  },

  async create(data: Partial<Client>): Promise<Client> {
    const response = await api.post<{ data: Client }>('/clients', data);
    return response.data.data;
  },

  async update(id: number | string, data: Partial<Client>): Promise<Client> {
    const response = await api.put<{ data: Client }>(`/clients/${id}`, data);
    return response.data.data;
  },

  async remove(id: number | string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
