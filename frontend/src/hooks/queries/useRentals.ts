import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalService, CreateRentalData } from '../../services/rentalService';

const QUERY_KEYS = {
  all: ['rentals'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...QUERY_KEYS.details(), id] as const,
  active: () => [...QUERY_KEYS.all, 'active'] as const,
  my: () => [...QUERY_KEYS.all, 'my'] as const,
  byClient: (clientId: number) => [...QUERY_KEYS.all, 'client', clientId] as const,
  byCar: (carId: number) => [...QUERY_KEYS.all, 'car', carId] as const,
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
export const useRental = (id: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => rentalService.getRentalById(id!),
    enabled: !!id,
  });
};

/**
 * Get my rentals (for regular users)
 */
export const useMyRentals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.my(),
    queryFn: () => rentalService.getMyRentals(),
  });
};

/**
 * Get rentals by client ID
 */
export const useRentalsByClient = (clientId: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.byClient(clientId!),
    queryFn: () => rentalService.getRentalsByClientId(clientId!),
    enabled: !!clientId,
  });
};

/**
 * Get rentals by car ID
 */
export const useRentalsByCar = (carId: number | undefined) => {
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
    mutationFn: ({ carId, startDate, expectedEndDate }: { carId: number; startDate: string; expectedEndDate: string }) =>
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
    mutationFn: ({ id, actualEndDate }: { id: number; actualEndDate?: string }) =>
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
    mutationFn: (id: number) => rentalService.cancelRental(id),
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
    mutationFn: ({ id, amount, reason }: { id: number; amount: number; reason: string }) =>
      rentalService.addPenalty(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });
};

