import api from './api';
import { Car, Client, Rental, CarSearchParams, RentalSearchParams } from '../interfaces';
import { mapCarFromService } from './carService';

export interface SearchCarsResponse {
  cars: Car[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const searchService = {
  async searchCars(params: CarSearchParams): Promise<SearchCarsResponse> {
    const response = await api.post<{
      data?: unknown[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/search/cars', params);
    const raw = response.data?.data;
    const cars = Array.isArray(raw) ? raw.map((dto) => mapCarFromService(dto)) : [];
    const d = response.data;
    const page = typeof d?.page === 'number' ? d.page : params.page ?? 1;
    const limit = typeof d?.limit === 'number' ? d.limit : params.limit ?? 12;
    const total = typeof d?.total === 'number' ? d.total : cars.length;
    const totalPages =
      typeof d?.totalPages === 'number' ? d.totalPages : Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return { cars, total, page, limit, totalPages };
  },

  async searchClients(query: string): Promise<Client[]> {
    const q = query.trim();
    /** Без `q` у query — гейтвей і user-service повертають усіх клієнтів; порожній `q=` інколи axios відкидає */
    const response = await api.get<{ data?: Client[] }>(
      '/search/clients',
      q ? { params: { q } } : {}
    );
    const raw = response.data?.data;
    return Array.isArray(raw) ? raw : [];
  },

  async searchRentals(params: RentalSearchParams): Promise<Rental[]> {
    const response = await api.post<{ data: Rental[] }>('/search/rentals', params);
    return response.data.data;
  },
};

