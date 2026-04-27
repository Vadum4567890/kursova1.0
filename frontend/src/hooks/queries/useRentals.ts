import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalService } from '../../services/rentalService';
import { CreateRentalData } from '../../interfaces';
import { useAuth } from '../../context/AuthContext';

const QUERY_KEYS = {
  all: ['rentals'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...QUERY_KEYS.details(), id] as const,
  active: () => [...QUERY_KEYS.all, 'active'] as const,
  my: () => [...QUERY_KEYS.all, 'my'] as const,
  ownerBookings: (userKey: string | number) => [...QUERY_KEYS.all, 'owner-bookings', userKey] as const,
  byClient: (clientId: number | string) => [...QUERY_KEYS.all, 'client', clientId] as const,
  byCar: (carId: number | string) => [...QUERY_KEYS.all, 'car', carId] as const,
};

/**
 * Get all rentals
 */
export const useRentals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => rentalService.getAllRentals(),
  });
};

/**
 * Get active rentals
 */
export const useActiveRentals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.active(),
    queryFn: () => rentalService.getActiveRentals(),
  });
};

/**
 * Get rental by ID
 */
export const useRental = (id: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => rentalService.getRentalById(id!),
    enabled: !!id,
  });
};

/**
 * Get my rentals (for regular users)
 */
export const useMyRentals = (options?: { refetchInterval?: number }) => {
  const { token, user, isLoading } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEYS.my(), user?.id ?? 'none'],
    queryFn: () => rentalService.getMyRentals(),
    enabled: !!token && !!user && !isLoading,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    // Список фільтрує лише rental-service за JWT; не порівнювати тут user.id з renterUserId —
    // у dev auth id числовий (10000), у БД renter_user_id — UUID (v5 від legacy:id).
  });
};

/** Заявки та бронювання по авто власника (JWT = owner_user_id). */
export const useOwnerBookings = () => {
  const { token, user, isLoading } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.ownerBookings(user?.id ?? 'none'),
    queryFn: () => rentalService.getOwnerBookings(),
    enabled: !!token && !!user && !isLoading,
    staleTime: 15_000,
  });
};

export const useApproveBookingAsOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (rentalId: string | number) => rentalService.approveBookingAsOwner(rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      if (user?.id != null) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerBookings(user.id) });
      }
    },
  });
};

export const useRejectBookingAsOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (rentalId: string | number) => rentalService.rejectBookingAsOwner(rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      if (user?.id != null) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerBookings(user.id) });
      }
    },
  });
};

/**
 * Get rentals by client ID
 */
export const useRentalsByClient = (clientId: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.byClient(clientId!),
    queryFn: () => rentalService.getRentalsByClientId(clientId!),
    enabled: !!clientId,
  });
};

/**
 * Get rentals by car ID
 */
export const useRentalsByCar = (carId: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.byCar(carId!),
    queryFn: () => rentalService.getRentalsByCarId(carId!),
    enabled: !!carId,
  });
};

/**
 * Create rental mutation
 */
export const useCreateRental = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRentalData) => rentalService.createRental(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

/**
 * Create booking mutation (for regular users)
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ carId, startDate, expectedEndDate }: { carId: number | string; startDate: string; expectedEndDate: string }) =>
      rentalService.createBooking(carId, startDate, expectedEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
};

/**
 * Complete rental mutation
 */
export const useCompleteRental = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, actualEndDate }: { id: number | string; actualEndDate?: string }) =>
      rentalService.completeRental(id, actualEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

/**
 * Cancel rental mutation
 */
export const useCancelRental = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => rentalService.cancelRental(id),
    onSuccess: () => {
      // Invalidate all rental queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      // Specifically invalidate my rentals
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.my() });
      // Invalidate analytics and reports
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

/**
 * Add penalty to rental mutation
 */
export const useAddPenalty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount, reason }: { id: number | string; amount: number; reason: string }) =>
      rentalService.addPenalty(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });
};
