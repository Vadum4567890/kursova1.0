import { useQuery } from '@tanstack/react-query';
import { searchService, CarSearchParams, ClientSearchParams, RentalSearchParams } from '../../services/searchService';

const QUERY_KEYS = {
  all: ['search'] as const,
  cars: (params?: CarSearchParams) => [...QUERY_KEYS.all, 'cars', params] as const,
  clients: (params?: ClientSearchParams) => [...QUERY_KEYS.all, 'clients', params] as const,
  rentals: (params?: RentalSearchParams) => [...QUERY_KEYS.all, 'rentals', params] as const,
};

export const useSearchCars = (params?: CarSearchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.cars(params),
    queryFn: () => searchService.searchCars(params),
    enabled: !!params && (!!params.query || !!params.brand || !!params.model || !!params.type),
  });
};

export const useSearchClients = (params?: ClientSearchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.clients(params),
    queryFn: () => searchService.searchClients(params),
    enabled: !!params && (!!params.query || !!params.phone || !!params.fullName),
  });
};

export const useSearchRentals = (params?: RentalSearchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.rentals(params),
    queryFn: () => searchService.searchRentals(params),
    enabled: !!params && (!!params.query || !!params.clientId || !!params.carId || !!params.startDate || !!params.endDate),
  });
};

