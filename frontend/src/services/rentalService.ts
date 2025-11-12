import api from './api';

export interface Rental {
  id: number;
  clientId: number;
  carId: number;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  depositAmount: number;
  totalCost: number;
  penaltyAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  client?: {
    id: number;
    fullName: string;
    phone: string;
  };
  car?: {
    id: number;
    brand: string;
    model: string;
    pricePerDay: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRentalData {
  clientId: number;
  carId: number;
  startDate: string;
  expectedEndDate: string;
}

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
    const response = await api.post<{ data: Rental }>(`/rentals/${id}/cancel`);
    return response.data.data;
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
};

