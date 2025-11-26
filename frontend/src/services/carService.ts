import api from './api';
import { Car, CarFilters } from '../interfaces';
import { PaginatedResponse } from '../types/common';

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

  async createCar(data: any): Promise<Car> {
    const response = await api.post<{ data: Car }>('/cars', data);
    return response.data.data;
  },

  async updateCar(id: number, data: any): Promise<Car> {
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

