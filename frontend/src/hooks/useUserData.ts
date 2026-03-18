import { useMemo } from 'react';
import { useMyRentals, useRentals } from './queries/useRentals';
import { useMyPenalties, usePenalties } from './queries/usePenalties';

/**
 * Hook to get user data (rentals and penalties) based on user role
 */
export function useUserData(userRole?: string) {
  const { data: myRentals = [], isLoading: loadingMyRentals } = useMyRentals();
  const { data: allRentals = [], isLoading: loadingAllRentals } = useRentals();
  const { data: myPenalties = [], isLoading: loadingMyPenalties } = useMyPenalties();
  const { data: allPenalties = [], isLoading: loadingAllPenalties } = usePenalties();

  const isEndUser = userRole === 'user' || userRole === 'renter';

  const rentals = useMemo(
    () => (isEndUser ? myRentals : allRentals),
    [isEndUser, myRentals, allRentals]
  );

  const penalties = useMemo(
    () => (isEndUser ? myPenalties : allPenalties),
    [isEndUser, myPenalties, allPenalties]
  );

  const loading = useMemo(
    () =>
      isEndUser
        ? loadingMyRentals || loadingMyPenalties
        : loadingAllRentals || loadingAllPenalties,
    [isEndUser, loadingMyRentals, loadingMyPenalties, loadingAllRentals, loadingAllPenalties]
  );

  return {
    rentals,
    penalties,
    loading,
  };
}

