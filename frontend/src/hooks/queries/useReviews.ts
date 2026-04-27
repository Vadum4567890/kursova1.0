import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../../services/reviewService';
import { SubmitReviewData, UpdateReviewData } from '../../interfaces';
import { useAuth } from '../../context/AuthContext';

const QUERY_KEYS = {
  all: ['reviews'] as const,
  eligible: (userId?: number | string) => [...QUERY_KEYS.all, 'eligible', userId ?? 'anon'] as const,
  bookingStatus: (bookingId: number | string) => [...QUERY_KEYS.all, 'booking-status', bookingId] as const,
  car: (carId: number | string) => [...QUERY_KEYS.all, 'car', carId] as const,
  user: (userId: number | string, role?: 'owner' | 'renter') => [...QUERY_KEYS.all, 'user', userId, role ?? 'all'] as const,
  carRating: (carId: number | string) => [...QUERY_KEYS.all, 'car-rating', carId] as const,
};

export const useEligibleReviews = () => {
  const { user, token, isLoading } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.eligible(user?.id),
    queryFn: () => reviewService.getEligibleReviews(),
    enabled: !!token && !!user && !isLoading,
  });
};

export const useBookingReviewStatus = (bookingId: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookingStatus(bookingId!),
    queryFn: () => reviewService.getBookingReviewStatus(bookingId!),
    enabled: !!bookingId,
  });
};

export const useCarReviews = (carId: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.car(carId!),
    queryFn: () => reviewService.getCarReviews(carId!),
    enabled: !!carId,
  });
};

export const useUserReviews = (userId: number | string | undefined, role?: 'owner' | 'renter') => {
  return useQuery({
    queryKey: QUERY_KEYS.user(userId!, role),
    queryFn: () => reviewService.getUserReviews(userId!, role),
    enabled: !!userId,
  });
};

export const useCarRating = (carId: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.carRating(carId!),
    queryFn: () => reviewService.getCarRating(carId!),
    enabled: !!carId,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewData) => reviewService.submitReview(payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookingStatus(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'car-rating'] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: UpdateReviewData }) =>
      reviewService.updateReview(bookingId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookingStatus(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'car-rating'] });
    },
  });
};
