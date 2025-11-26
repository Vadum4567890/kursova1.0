import api from './api';
import { DashboardStats, PopularCar, TopClient } from '../interfaces';

export const analyticsService = {
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const response = await api.get<{ data: DashboardStats }>('/analytics/dashboard', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getRevenueStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await api.get('/analytics/revenue', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getPopularCars(limit: number = 10): Promise<PopularCar[]> {
    const response = await api.get<{ data: PopularCar[] }>('/analytics/popular-cars', {
      params: { limit },
    });
    return response.data.data;
  },

  async getTopClients(limit: number = 10, startDate?: string, endDate?: string): Promise<TopClient[]> {
    const response = await api.get<{ data: TopClient[] }>('/analytics/top-clients', {
      params: { limit, startDate, endDate },
    });
    return response.data.data;
  },

  async getOccupancyRate(): Promise<number> {
    const response = await api.get<{ data: { occupancyRate: number } }>('/analytics/occupancy-rate');
    return response.data.data.occupancyRate;
  },

  async getRevenueForecast(): Promise<any> {
    const response = await api.get('/analytics/revenue-forecast');
    return response.data.data;
  },
};

