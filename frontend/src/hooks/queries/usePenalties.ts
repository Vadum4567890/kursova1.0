import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { penaltyService, CreatePenaltyData } from '../../services/penaltyService';

const QUERY_KEYS = {
  all: ['penalties'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...QUERY_KEYS.details(), id] as const,
  my: () => [...QUERY_KEYS.all, 'my'] as const,
  byRental: (rentalId: number) => [...QUERY_KEYS.all, 'rental', rentalId] as const,
};

export const usePenalties = () => {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => penaltyService.getAllPenalties(),
  });
};

export const usePenalty = (id: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => penaltyService.getPenaltyById(id!),
    enabled: !!id,
  });
};

export const useMyPenalties = () => {
  // Backend automatically filters penalties for current user
  return useQuery({
    queryKey: QUERY_KEYS.my(),
    queryFn: () => penaltyService.getAllPenalties(),
  });
};

export const usePenaltiesByRental = (rentalId: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.byRental(rentalId!),
    queryFn: () => penaltyService.getPenaltiesByRentalId(rentalId!),
    enabled: !!rentalId,
  });
};

export const useCreatePenalty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePenaltyData) => penaltyService.createPenalty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
  });
};

// Note: updatePenalty is not available in penaltyService
// Penalties cannot be updated, only created or deleted

export const useDeletePenalty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => penaltyService.deletePenalty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};

