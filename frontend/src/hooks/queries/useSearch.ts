import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../services/searchService';
import { CarSearchParams, RentalSearchParams } from '../../interfaces';

const QUERY_KEYS = {
  all: ['search'] as const,
  cars: (params?: CarSearchParams) => [...QUERY_KEYS.all, 'cars', params] as const,
  clients: (query?: string) => [...QUERY_KEYS.all, 'clients', query] as const,
  rentals: (params?: RentalSearchParams) => [...QUERY_KEYS.all, 'rentals', params] as const,
};

export const useSearchCars = (params?: CarSearchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.cars(params),
    queryFn: () => {
      if (!params) throw new Error('Params are required');
      return searchService.searchCars(params);
    },
    enabled: !!params && (!!params.brand || !!params.model || !!params.type),
  });
};

export const useSearchClients = (query?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.clients(query),
    queryFn: () => {
      if (!query) throw new Error('Query is required');
      return searchService.searchClients(query);
    },
    enabled: !!query,
  });
};

export const useSearchRentals = (params?: RentalSearchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.rentals(params),
    queryFn: () => {
      if (!params) throw new Error('Params are required');
      return searchService.searchRentals(params);
    },
    enabled: !!params && (!!params.clientId || !!params.carId || !!params.startDate || !!params.endDate),
  });
};

