/**
 * Utility functions for chart data formatting
 */
import { formatDateShort } from './dateHelpers';

interface RevenueItem {
  date: string | Date;
  amount: number;
}

interface PopularCar {
  car: {
    brand: string;
    model: string;
  };
  rentalCount: number;
  totalRevenue: number;
}

/**
 * Format revenue data for chart display
 */
export function formatRevenueData(revenueStats?: { revenueByDay?: RevenueItem[] }, days: number = 7) {
  if (!revenueStats?.revenueByDay) return [];
  return revenueStats.revenueByDay
    .slice(-days)
    .map((item: RevenueItem) => ({
      date: formatDateShort(item.date),
      Дохід: Math.round(item.amount),
    }));
}

/**
 * Format popular cars data for chart display
 */
export function formatPopularCarsData(popularCars: PopularCar[]) {
  return popularCars.map((car: PopularCar) => ({
    name: `${car.car.brand} ${car.car.model}`,
    Прокатів: car.rentalCount,
    Дохід: Math.round(car.totalRevenue),
  }));
}

/**
 * Format popular cars data for bar chart (with Кількість instead of Прокатів)
 */
export function formatPopularCarsBarData(popularCars: PopularCar[]) {
  return popularCars.map((car: PopularCar) => ({
    name: `${car.car.brand} ${car.car.model}`,
    Кількість: car.rentalCount,
    Дохід: Math.round(car.totalRevenue),
  }));
}

/**
 * Format car status data for pie chart
 */
export function formatCarStatusData(stats?: {
  availableCars?: number;
  rentedCars?: number;
  maintenanceCars?: number;
}) {
  if (!stats) return [];
  return [
    { name: 'Доступні', value: stats.availableCars || 0, color: '#2e7d32' },
    { name: 'В прокаті', value: stats.rentedCars || 0, color: '#ed6c02' },
    { name: 'На обслуговуванні', value: stats.maintenanceCars || 0, color: '#d32f2f' },
  ].filter((item) => item.value > 0);
}

