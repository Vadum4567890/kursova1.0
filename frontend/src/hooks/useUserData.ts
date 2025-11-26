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

  const isUser = userRole === 'user';

  const rentals = useMemo(
    () => (isUser ? myRentals : allRentals),
    [isUser, myRentals, allRentals]
  );

  const penalties = useMemo(
    () => (isUser ? myPenalties : allPenalties),
    [isUser, myPenalties, allPenalties]
  );

  const loading = useMemo(
    () =>
      isUser
        ? loadingMyRentals || loadingMyPenalties
        : loadingAllRentals || loadingAllPenalties,
    [isUser, loadingMyRentals, loadingMyPenalties, loadingAllRentals, loadingAllPenalties]
  );

  return {
    rentals,
    penalties,
    loading,
  };
}

