import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carService } from '../../services/carService';
import { Car, CarFilters } from '../../interfaces';
import { useAuth } from '../../context/AuthContext';

const QUERY_KEYS = {
  all: ['cars'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: CarFilters) => [...QUERY_KEYS.lists(), filters] as const,
  my: () => [...QUERY_KEYS.all, 'my'] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...QUERY_KEYS.details(), id] as const,
  available: (filters?: CarFilters) => [...QUERY_KEYS.all, 'available', filters] as const,
  byType: (type: string, filters?: CarFilters) => [...QUERY_KEYS.all, 'type', type, filters] as const,
  bookedDates: (id: number | string) => [...QUERY_KEYS.all, 'booked-dates', id] as const,
};

/**
 * Get all cars with filters
 */
export const useCars = (filters?: CarFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => carService.getAllCars(filters),
  });
};

/**
 * Get current user's cars (marketplace owner)
 * Ключ містить user.id — інакше після логіну іншого акаунта 5 хв staleTime показував би кеш попереднього юзера.
 */
export const useMyCars = () => {
  const { user, isLoading: authLoading, token } = useAuth();
  /** Фрагмент JWT у ключі — щоб після зміни сесії не підхоплювався кеш іншого токена */
  const sessionKey = token ? token.slice(-32) : 'none';
  return useQuery({
    queryKey: [...QUERY_KEYS.my(), user?.id ?? 'none', sessionKey],
    queryFn: () => carService.getMyCars(),
    enabled: !authLoading && !!user && !!token,
    staleTime: 0,
  });
};

/**
 * Get available cars
 */
export const useAvailableCars = (filters?: CarFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.available(filters),
    queryFn: () => carService.getAvailableCars(filters),
  });
};

/**
 * Get car by ID (number from monolith or string UUID from car-service)
 */
export const useCar = (id: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => carService.getCarById(id!),
    enabled: !!id,
  });
};

/**
 * Get cars by type
 */
export const useCarsByType = (type: string, filters?: CarFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.byType(type, filters),
    queryFn: () => carService.getCarsByType(type, filters),
    enabled: !!type,
  });
};

/**
 * Get booked dates for a car
 */
export const useBookedDates = (id: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookedDates(id!),
    queryFn: () => carService.getBookedDates(id!),
    enabled: !!id,
  });
};

/**
 * Create car mutation
 */
export const useCreateCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Car>) => carService.createCar(data),
    onSuccess: () => {
      /* Префікс ['cars'] охоплює list, my, available, detail, … — не лише ['cars','list'] */
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

/**
 * Update car mutation
 */
export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Car> }) =>
      carService.updateCar(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) });
    },
  });
};

/**
 * Update car status mutation
 */
export const useUpdateCarStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: Car['status'] }) =>
      carService.updateCarStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) });
    },
  });
};

/**
 * Delete car mutation
 */
export const useDeleteCar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => carService.deleteCar(id),
    onSuccess: async (_, deletedId) => {
      /** Одразу прибираємо з кешу «Мої авто» (інколи invalidate сам по собі не перемальовує список) */
      queryClient.setQueriesData<{ data: Car[]; count: number }>(
        { queryKey: [...QUERY_KEYS.my()] },
        (old) => {
          if (!old?.data || !Array.isArray(old.data)) return old;
          const data = old.data.filter((c) => String(c.id) !== String(deletedId));
          return { ...old, data, count: data.length };
        }
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.all, type: 'active' });
    },
  });
};

