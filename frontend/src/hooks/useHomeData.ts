import { useMemo } from 'react';
import { useCars } from './queries/useCars';
import { useMyRentals } from './queries/useRentals';
import { useMyPenalties } from './queries/usePenalties';

/**
 * Hook to get all home page data for regular users
 */
export function useHomeData() {
  const { data: carsResponse, isLoading: loadingCars } = useCars();
  const { data: rentals = [], isLoading: loadingRentals } = useMyRentals();
  const { data: penalties = [], isLoading: loadingPenalties } = useMyPenalties();

  const cars = useMemo(() => carsResponse?.data || [], [carsResponse]);
  const availableCars = useMemo(() => cars.filter((car: any) => car.status === 'available'), [cars]);
  const activeRentals = useMemo(() => rentals.filter((r: any) => r.status === 'active'), [rentals]);
  const totalPenalties = useMemo(
    () => penalties.reduce((sum: number, p: any) => sum + p.amount, 0),
    [penalties]
  );

  const loading = loadingCars || loadingRentals || loadingPenalties;

  return {
    cars,
    availableCars,
    rentals,
    activeRentals,
    penalties,
    totalPenalties,
    loading,
  };
}

