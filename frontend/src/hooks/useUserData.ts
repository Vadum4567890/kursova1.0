import { useMemo } from 'react';
import { useMyRentals } from './queries/useRentals';
import { usePenalties } from './queries/usePenalties';

/**
 * Hook to get user data (rentals and penalties) for the profile page.
 * Always returns only the current user's own data, regardless of role.
 * Admins/managers see ALL data on dedicated pages (RentalsPage, etc.).
 */
export function useUserData(_userRole?: string) {
  const { data: myRentals = [], isLoading: loadingMyRentals } = useMyRentals();
  const { data: allPenalties = [], isLoading: loadingPenalties } = usePenalties();

  // Filter penalties to only those linked to the current user's rentals
  const myRentalIds = useMemo(
    () => new Set(myRentals.map((r) => String(r.id))),
    [myRentals]
  );

  const myPenalties = useMemo(
    () => allPenalties.filter((p) => myRentalIds.has(String(p.rentalId))),
    [allPenalties, myRentalIds]
  );

  return {
    rentals: myRentals,
    penalties: myPenalties,
    loading: loadingMyRentals || loadingPenalties,
  };
}

