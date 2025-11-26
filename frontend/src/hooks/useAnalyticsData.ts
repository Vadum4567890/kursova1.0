import { useMemo, useCallback } from 'react';
import {
  useDashboardStats,
  usePopularCars,
  useTopClients,
  useOccupancyRate,
  useRevenueStats,
} from './queries/useAnalytics';
import { formatRevenueData, formatPopularCarsBarData } from '../utils/chartHelpers';

/**
 * Hook to get all analytics data
 */
export function useAnalyticsData(startDate?: string, endDate?: string) {
  const { data: dashboardStats, isLoading: loadingStats, error: statsError } = useDashboardStats();
  const { data: popularCars = [], isLoading: loadingPopular, error: popularError } = usePopularCars(5);
  const {
    data: topClients = [],
    isLoading: loadingTop,
    error: topError,
    refetch: refetchTopClients,
  } = useTopClients(5, startDate, endDate);
  const { data: occupancyRate = 0, isLoading: loadingOccupancy, error: occupancyError } =
    useOccupancyRate();
  const {
    data: revenueStats,
    isLoading: loadingRevenue,
    error: revenueError,
    refetch: refetchRevenue,
  } = useRevenueStats(startDate, endDate);

  const loading = loadingStats || loadingPopular || loadingTop || loadingOccupancy || loadingRevenue;
  const error =
    statsError?.message ||
    popularError?.message ||
    topError?.message ||
    occupancyError?.message ||
    revenueError?.message;

  const revenueData = useMemo(() => formatRevenueData(revenueStats), [revenueStats]);
  const popularCarsData = useMemo(() => formatPopularCarsBarData(popularCars), [popularCars]);

  const refetchFilteredData = useCallback(() => {
    refetchTopClients();
    refetchRevenue();
  }, [refetchTopClients, refetchRevenue]);

  return {
    dashboardStats,
    popularCars,
    popularCarsData,
    topClients,
    occupancyRate,
    revenueStats,
    revenueData,
    loading,
    error,
    refetchFilteredData,
  };
}

