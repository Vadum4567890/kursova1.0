import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';

const QUERY_KEYS = {
  all: ['analytics'] as const,
  dashboard: () => [...QUERY_KEYS.all, 'dashboard'] as const,
  revenue: (startDate?: string, endDate?: string) => [...QUERY_KEYS.all, 'revenue', startDate, endDate] as const,
  popularCars: () => [...QUERY_KEYS.all, 'popular-cars'] as const,
  topClients: (startDate?: string, endDate?: string) => [...QUERY_KEYS.all, 'top-clients', startDate, endDate] as const,
  occupancy: () => [...QUERY_KEYS.all, 'occupancy'] as const,
  forecast: () => [...QUERY_KEYS.all, 'forecast'] as const,
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: () => analyticsService.getDashboardStats(),
  });
};

// Note: getTotalRevenue doesn't exist in analyticsService, using getRevenueStats instead
export const useTotalRevenue = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.revenue(startDate, endDate),
    queryFn: async () => {
      const stats = await analyticsService.getRevenueStats(startDate, endDate);
      return stats?.totalRevenue || 0;
    },
  });
};

/**
 * Get revenue stats (with revenueByDay for charts)
 */
export const useRevenueStats = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.revenue(startDate, endDate), 'stats'],
    queryFn: () => analyticsService.getRevenueStats(startDate, endDate),
  });
};

export const usePopularCars = (limit: number = 10) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.popularCars(), limit],
    queryFn: () => analyticsService.getPopularCars(limit),
  });
};

export const useTopClients = (limit: number = 10, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.topClients(startDate, endDate), limit],
    queryFn: () => analyticsService.getTopClients(limit, startDate, endDate),
  });
};

export const useOccupancyRate = () => {
  return useQuery({
    queryKey: QUERY_KEYS.occupancy(),
    queryFn: () => analyticsService.getOccupancyRate(),
  });
};

export const useRevenueForecast = () => {
  return useQuery({
    queryKey: QUERY_KEYS.forecast(),
    queryFn: () => analyticsService.getRevenueForecast(),
  });
};

