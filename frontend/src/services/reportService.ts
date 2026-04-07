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

  async downloadFinancialReport(format: 'xlsx' | 'pdf', startDate?: string, endDate?: string): Promise<void> {
    const response = await api.get(`/reports/financial/export`, {
      params: { format, startDate, endDate },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type:
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
