import { useMemo } from 'react';
import { useDashboardStats, usePopularCars, useRevenueStats } from './queries/useAnalytics';
import { useCars } from './queries/useCars';
import { useClients } from './queries/useClients';
import { useRentals } from './queries/useRentals';
import { DashboardStats } from '../interfaces';

/**
 * Hook to get dashboard data based on user role
 */
export function useDashboardData(userRole?: string) {
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

  // React Query hooks for admin/manager
  const { data: dashboardStats, isLoading: loadingStats, error: statsError } = useDashboardStats();
  const { data: popularCars = [], isLoading: loadingPopular, error: popularError } = usePopularCars(5);
  const { data: revenueStats, isLoading: loadingRevenue, error: revenueError } = useRevenueStats();

  // React Query hooks for employees
  const { data: carsResponse, isLoading: loadingCars } = useCars();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: rentals = [], isLoading: loadingRentals } = useRentals();

  // Calculate employee stats from data
  const employeeStats: DashboardStats | null = useMemo(() => {
    if (isAdminOrManager || !carsResponse?.data) return null;
    const cars = carsResponse.data;
    return {
      totalCars: cars.length,
      availableCars: cars.filter((c) => c.status === 'available').length,
      rentedCars: cars.filter((c) => c.status === 'rented').length,
      totalClients: clients.length,
      activeRentals: rentals.filter((r) => r.status === 'active').length,
      totalRevenue: 0,
      totalPenalties: 0,
      averageRentalDuration: 0,
    };
  }, [carsResponse, clients, rentals, isAdminOrManager]);

  // Select stats based on role
  const stats = isAdminOrManager ? dashboardStats : employeeStats;
  const loading = isAdminOrManager
    ? (loadingStats || loadingPopular || loadingRevenue)
    : (loadingCars || loadingClients || loadingRentals);
  const error = statsError?.message || popularError?.message || revenueError?.message;

  return {
    stats,
    popularCars,
    revenueStats,
    loading,
    error,
    isAdminOrManager,
  };
}

