import api from './api';

export interface Client {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  registrationDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export const clientService = {
  async getAllClients(): Promise<Client[]> {
    const response = await api.get<Client[]>('/clients');
    return response.data;
  },

  async getClientById(id: number): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async getClientByPhone(phone: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/phone/${phone}`);
    return response.data;
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    const response = await api.post<{ data: Client }>('/clients', data);
    return response.data.data;
  },

  async registerOrGetClient(data: Partial<Client>): Promise<Client> {
    const response = await api.post<{ data: Client }>('/clients/register', data);
    return response.data.data;
  },

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    const response = await api.put<{ data: Client }>(`/clients/${id}`, data);
    return response.data.data;
  },

  async deleteClient(id: number): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};

