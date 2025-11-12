import api from './api';
import { Car } from './carService';
import { Client } from './clientService';
import { Rental } from './rentalService';

export interface CarSearchParams {
  brand?: string;
  model?: string;
  type?: 'economy' | 'business' | 'premium';
  status?: 'available' | 'rented' | 'maintenance';
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
}

export interface RentalSearchParams {
  clientId?: number;
  carId?: number;
  status?: 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

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

