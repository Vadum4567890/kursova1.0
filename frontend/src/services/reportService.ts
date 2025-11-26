import api from './api';
import { FinancialReport, OccupancyReport, AvailabilityReport, CarReport } from '../interfaces';

export const reportService = {
  async generateFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const response = await api.get<{ data: FinancialReport }>('/reports/financial', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  async generateOccupancyReport(): Promise<OccupancyReport> {
    const response = await api.get<{ data: OccupancyReport }>('/reports/occupancy');
    return response.data.data;
  },

  async generateAvailabilityReport(): Promise<AvailabilityReport> {
    const response = await api.get<{ data: AvailabilityReport }>('/reports/availability');
    return response.data.data;
  },

  async generateCarReport(startDate?: string, endDate?: string): Promise<CarReport> {
    const response = await api.get<{ data: CarReport }>('/reports/cars', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },
};
