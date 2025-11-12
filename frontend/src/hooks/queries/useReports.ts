import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';

const QUERY_KEYS = {
  all: ['reports'] as const,
  financial: (startDate?: string, endDate?: string) => [...QUERY_KEYS.all, 'financial', startDate, endDate] as const,
  occupancy: () => [...QUERY_KEYS.all, 'occupancy'] as const,
  availability: () => [...QUERY_KEYS.all, 'availability'] as const,
};

export const useFinancialReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.financial(startDate, endDate),
    queryFn: () => reportService.generateFinancialReport(startDate, endDate),
    enabled: !!(startDate && endDate),
  });
};

export const useOccupancyReport = () => {
  return useQuery({
    queryKey: QUERY_KEYS.occupancy(),
    queryFn: () => reportService.generateOccupancyReport(),
  });
};

export const useAvailabilityReport = () => {
  return useQuery({
    queryKey: QUERY_KEYS.availability(),
    queryFn: () => reportService.generateAvailabilityReport(),
  });
};

