import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carService } from '../../services/carService';
import { Car, CarFilters } from '../../interfaces';

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
 */
export const useMyCars = () => {
  return useQuery({
    queryKey: QUERY_KEYS.my(),
    queryFn: () => carService.getMyCars(),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.my() });
    },
  });
};

/**
 * Update car mutation
 */
export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Car> }) =>
      carService.updateCar(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.my() });
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
    mutationFn: ({ id, status }: { id: number; status: Car['status'] }) =>
      carService.updateCarStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
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
    mutationFn: (id: number) => carService.deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.my() });
    },
  });
};

