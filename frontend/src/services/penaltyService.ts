import api from './api';
import { Penalty, CreatePenaltyData } from '../interfaces';

export const penaltyService = {
  async getAllPenalties(): Promise<Penalty[]> {
    const response = await api.get<Penalty[]>('/penalties');
    return response.data;
  },

  async getPenaltyById(id: number): Promise<Penalty> {
    const response = await api.get<Penalty>(`/penalties/${id}`);
    return response.data;
  },

  async getPenaltiesByRentalId(rentalId: number): Promise<Penalty[]> {
    const response = await api.get<Penalty[]>(`/penalties/rental/${rentalId}`);
    return response.data;
  },

  async getTotalPenaltyByRentalId(rentalId: number): Promise<number> {
    const response = await api.get<{ total: number }>(`/penalties/rental/${rentalId}/total`);
    return response.data.total;
  },

  async createPenalty(data: CreatePenaltyData): Promise<Penalty> {
    const response = await api.post<{ data: Penalty }>('/penalties', data);
    return response.data.data;
  },

  async deletePenalty(id: number): Promise<void> {
    await api.delete(`/penalties/${id}`);
  },
};

