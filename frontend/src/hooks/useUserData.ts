import { useMyRentals } from './queries/useRentals';
import { useMyPenalties } from './queries/usePenalties';

/**
 * Hook to get user data (rentals and penalties) for the profile page.
 * Always returns only the current user's own data, regardless of role.
 * Admins/managers see ALL data on dedicated pages (RentalsPage, etc.).
 */
export function useUserData(_userRole?: string) {
  const { data: myRentals = [], isLoading: loadingMyRentals } = useMyRentals();
  const { data: myPenalties = [], isLoading: loadingPenalties } = useMyPenalties();

  return {
    rentals: myRentals,
    penalties: myPenalties,
    loading: loadingMyRentals || loadingPenalties,
  };
}

