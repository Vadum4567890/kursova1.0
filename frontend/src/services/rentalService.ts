import api from './api';
import { Rental, CreateRentalData } from '../interfaces';

export const rentalService = {
  async getAllRentals(): Promise<Rental[]> {
    const response = await api.get<Rental[]>('/rentals');
    return response.data;
  },

  async getActiveRentals(): Promise<Rental[]> {
    const response = await api.get<Rental[]>('/rentals/active');
    return response.data;
  },

  async getRentalById(id: number): Promise<Rental> {
    const response = await api.get<Rental>(`/rentals/${id}`);
    return response.data;
  },

  async getRentalsByClientId(clientId: number): Promise<Rental[]> {
    const response = await api.get<Rental[]>(`/rentals/client/${clientId}`);
    return response.data;
  },

  async getRentalsByCarId(carId: number): Promise<Rental[]> {
    const response = await api.get<Rental[]>(`/rentals/car/${carId}`);
    return response.data;
  },

  async createRental(data: CreateRentalData): Promise<Rental> {
    const response = await api.post<{ data: Rental }>('/rentals', data);
    return response.data.data;
  },

  async completeRental(id: number, actualEndDate?: string): Promise<Rental> {
    const response = await api.post<{ data: Rental }>(`/rentals/${id}/complete`, { actualEndDate });
    return response.data.data;
  },

  async cancelRental(id: number): Promise<Rental> {
    const response = await api.post<Rental>(`/rentals/${id}/cancel`);
    return response.data;
  },

  async addPenalty(id: number, amount: number, reason: string): Promise<void> {
    await api.post(`/rentals/${id}/penalty`, { amount, reason });
  },

  async getMyRentals(): Promise<Rental[]> {
    const response = await api.get<Rental[]>('/rentals/my');
    return response.data;
  },

  async createBooking(carId: number, startDate: string, expectedEndDate: string): Promise<Rental> {
    const response = await api.post<Rental>('/rentals/book', {
      carId,
      startDate,
      expectedEndDate,
    });
    return response.data;
  },

  async exportToExcel(): Promise<Blob> {
    const response = await api.get('/rentals/export/excel', {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportToCSV(): Promise<Blob> {
    const response = await api.get('/rentals/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  async importRentals(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/rentals/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async downloadTemplate(format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    const response = await api.get(`/rentals/import/template?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

