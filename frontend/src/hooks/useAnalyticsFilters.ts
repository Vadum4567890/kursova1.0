import { useState, useCallback, useEffect } from 'react';

interface UseAnalyticsFiltersOptions {
  onFilterChange?: (startDate?: string, endDate?: string) => void;
}

/**
 * Hook for managing analytics date range filters
 */
export function useAnalyticsFilters(options: UseAnalyticsFiltersOptions = {}) {
  const { onFilterChange } = options;
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const startDate = dateRange.startDate || undefined;
  const endDate = dateRange.endDate || undefined;

  useEffect(() => {
    onFilterChange?.(startDate, endDate);
  }, [startDate, endDate, onFilterChange]);

  const updateStartDate = useCallback((value: string) => {
    setDateRange((prev) => ({ ...prev, startDate: value }));
  }, []);

  const updateEndDate = useCallback((value: string) => {
    setDateRange((prev) => ({ ...prev, endDate: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
  }, []);

  const hasActiveFilters: boolean = !!(dateRange.startDate || dateRange.endDate);

  return {
    dateRange,
    startDate,
    endDate,
    updateStartDate,
    updateEndDate,
    resetFilters,
    hasActiveFilters,
  };
}

