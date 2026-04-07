import api from './api';
import { Rental, CreateRentalData } from '../interfaces';
import { mapRentalFromApi, mapRentalsList } from './rentalMapper';
import { isUpstreamUnavailable } from '../utils/upstreamErrors';

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const rentalService = {
  async getAllRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getActiveRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals/active');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getRentalById(id: number | string): Promise<Rental> {
    const response = await api.get<unknown>(`/rentals/${id}`);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async getRentalsByClientId(clientId: number | string): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>(`/rentals/client/${clientId}`);
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getRentalsByCarId(carId: number | string): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>(`/rentals/car/${carId}`);
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async createRental(data: CreateRentalData): Promise<Rental> {
    const payload = data.renterUserId
      ? data
      : {
          ...data,
          ...(data.clientId !== undefined ? { renterUserId: String(data.clientId) } : {}),
        };
    const response = await api.post<unknown>('/rentals', payload);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async completeRental(id: number | string, actualEndDate?: string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${id}/complete`, { actualEndDate });
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async cancelRental(id: number | string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${id}/cancel`);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async addPenalty(id: number | string, amount: number, reason: string): Promise<void> {
    await api.post(`/rentals/${id}/penalty`, { amount, reason });
  },

  async getMyRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals/my');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async createBooking(carId: number | string, startDate: string, expectedEndDate: string): Promise<Rental> {
    const response = await api.post<unknown>('/rentals/book', {
      carId,
      startDate,
      expectedEndDate,
    });
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },
};
