import api from './api';

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: 'economy' | 'business' | 'premium';
  pricePerDay: number;
  deposit: number;
  status: 'available' | 'rented' | 'maintenance';
  description?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images
  // Additional specifications
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarFilters {
  type?: string;
  status?: string;
  brand?: string;
  model?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const carService = {
  async getAllCars(filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<PaginatedResponse<Car>>('/cars', { params: filters });
    return response.data;
  },

  async getAvailableCars(filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<PaginatedResponse<Car>>('/cars/available', { params: filters });
    return response.data;
  },

  async getCarById(id: number): Promise<Car> {
    const response = await api.get<Car>(`/cars/${id}`);
    return response.data;
  },

  async getCarsByType(type: string, filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<PaginatedResponse<Car>>(`/cars/type/${type}`, { params: filters });
    return response.data;
  },

  async createCar(data: Partial<Car>): Promise<Car> {
    const response = await api.post<{ data: Car }>('/cars', data);
    return response.data.data;
  },

  async updateCar(id: number, data: Partial<Car>): Promise<Car> {
    const response = await api.put<{ data: Car }>(`/cars/${id}`, data);
    return response.data.data;
  },

  async updateCarStatus(id: number, status: Car['status']): Promise<Car> {
    const response = await api.patch<{ data: Car }>(`/cars/${id}/status`, { status });
    return response.data.data;
  },

  async deleteCar(id: number): Promise<void> {
    await api.delete(`/cars/${id}`);
  },

  async getBookedDates(id: number): Promise<Array<{ startDate: string; endDate: string }>> {
    const response = await api.get<Array<{ startDate: string; endDate: string }>>(`/cars/${id}/booked-dates`);
    return response.data;
  },
};

