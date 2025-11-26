import api from './api';
import { Car, Client, Rental, CarSearchParams, RentalSearchParams } from '../interfaces';

export const searchService = {
  async searchCars(params: CarSearchParams): Promise<Car[]> {
    const response = await api.post<{ data: Car[] }>('/search/cars', params);
    return response.data.data;
  },

  async searchClients(query: string): Promise<Client[]> {
    const response = await api.get<{ data: Client[] }>('/search/clients', {
      params: { q: query }
    });
    return response.data.data;
  },

  async searchRentals(params: RentalSearchParams): Promise<Rental[]> {
    const response = await api.post<{ data: Rental[] }>('/search/rentals', params);
    return response.data.data;
  },
};

