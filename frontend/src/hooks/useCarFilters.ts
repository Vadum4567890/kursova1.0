import { useState, useCallback } from 'react';
import { CarFilters } from '../interfaces';
import { filterBySearchTerm } from '../utils/filters';
import { Car } from '../interfaces';

interface UseCarFiltersOptions {
  initialFilters?: CarFilters;
  initialSearchTerm?: string;
}

export function useCarFilters(options: UseCarFiltersOptions = {}) {
  const { initialFilters = { page: 1, limit: 12 }, initialSearchTerm = '' } = options;

  const [filters, setFilters] = useState<CarFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const updateFilters = useCallback((newFilters: Partial<CarFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm(initialSearchTerm);
  }, [initialFilters, initialSearchTerm]);

  const filterCars = useCallback(
    (cars: Car[]) => {
      return filterBySearchTerm(cars, searchTerm, ['brand', 'model']);
    },
    [searchTerm]
  );

  return {
    filters,
    searchTerm,
    setFilters,
    setSearchTerm,
    updateFilters,
    resetFilters,
    filterCars,
  };
}

