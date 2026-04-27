import api from './api';
import { FinancialReport, OccupancyReport, AvailabilityReport, CarReport } from '../interfaces';

const MIME_TYPES = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

function getDownloadFileName(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const match = contentDisposition.match(/filename="?(?<name>[^"]+)"?/i);
  return match?.groups?.name || fallback;
}

async function downloadReport(
  url: string,
  fallbackFileName: string,
  params?: Record<string, string | undefined>
): Promise<void> {
  const response = await api.get(url, {
    params,
    responseType: 'blob',
  });

  const format = fallbackFileName.endsWith('.pdf') ? 'pdf' : 'xlsx';
  const blob = new Blob([response.data], { type: MIME_TYPES[format] });
  const fileName = getDownloadFileName(response.headers['content-disposition'], fallbackFileName);
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(objectUrl);
}

export const reportService = {
  async generateFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const response = await api.get<{ data: FinancialReport }>('/reports/financial', {
      params: { startDate, endDate },
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
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async downloadFinancialReport(format: 'xlsx' | 'pdf', startDate?: string, endDate?: string): Promise<void> {
    await downloadReport('/reports/financial/export', `financial-report.${format}`, {
      format,
      startDate,
      endDate,
    });
  },

  async downloadOccupancyReport(format: 'xlsx' | 'pdf'): Promise<void> {
    await downloadReport('/reports/occupancy/export', `occupancy-report.${format}`, { format });
  },

  async downloadCarReport(format: 'xlsx' | 'pdf', startDate?: string, endDate?: string): Promise<void> {
    await downloadReport('/reports/cars/export', `car-report.${format}`, {
      format,
      startDate,
      endDate,
    });
  },
};
