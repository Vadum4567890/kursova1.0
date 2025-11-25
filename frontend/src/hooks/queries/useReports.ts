import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';

const QUERY_KEYS = {
  all: ['reports'] as const,
  financial: (startDate?: string, endDate?: string) => [...QUERY_KEYS.all, 'financial', startDate, endDate] as const,
  occupancy: () => [...QUERY_KEYS.all, 'occupancy'] as const,
  availability: () => [...QUERY_KEYS.all, 'availability'] as const,
  cars: (startDate?: string, endDate?: string) => [...QUERY_KEYS.all, 'cars', startDate, endDate] as const,
};

export const useFinancialReport = (startDate?: string, endDate?: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.financial(startDate, endDate),
    queryFn: () => reportService.generateFinancialReport(startDate, endDate),
    enabled: enabled && !!(startDate && endDate),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

export const useOccupancyReport = (enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.occupancy(),
    queryFn: () => reportService.generateOccupancyReport(),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

export const useAvailabilityReport = (enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.availability(),
    queryFn: () => reportService.generateAvailabilityReport(),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

export const useCarReport = (startDate?: string, endDate?: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.cars(startDate, endDate),
    queryFn: () => reportService.generateCarReport(startDate, endDate),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

