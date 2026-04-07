import api from './api';
import { Penalty, CreatePenaltyData } from '../interfaces';
import { isUpstreamUnavailable } from '../utils/upstreamErrors';

export const penaltyService = {
  async getAllPenalties(): Promise<Penalty[]> {
    try {
      const response = await api.get<Penalty[]>('/penalties');
      return response.data;
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getPenaltyById(id: string | number): Promise<Penalty> {
    const response = await api.get<Penalty>(`/penalties/${id}`);
    return response.data;
  },

  async getPenaltiesByRentalId(rentalId: string | number): Promise<Penalty[]> {
    try {
      const response = await api.get<Penalty[]>(`/penalties/rental/${rentalId}`);
      return response.data;
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getTotalPenaltyByRentalId(rentalId: string | number): Promise<number> {
    const response = await api.get<{ total: number }>(`/penalties/rental/${rentalId}/total`);
    return response.data.total;
  },

  async createPenalty(data: CreatePenaltyData): Promise<Penalty> {
    const response = await api.post<Penalty | { data: Penalty }>('/penalties', data);
    const body = response.data;
    return ('data' in body && body.data !== undefined ? body.data : body) as Penalty;
  },

  async deletePenalty(id: string | number): Promise<void> {
    await api.delete(`/penalties/${id}`);
  },
};

