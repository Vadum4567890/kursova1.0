import { useState, useCallback } from 'react';
import { CarSearchParams, RentalSearchParams } from '../interfaces';

/**
 * Hook for managing search state and operations
 */
export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Car search (page/limit — серверна пагінація через api-gateway /search/cars)
  const [carParams, setCarParams] = useState<CarSearchParams>({ page: 1, limit: 12 });

  // Client search
  const [clientQuery, setClientQuery] = useState('');

  // Rental search
  const [rentalParams, setRentalParams] = useState<RentalSearchParams>({});

  const updateCarParams = useCallback((updates: Partial<CarSearchParams>) => {
    setCarParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateRentalParams = useCallback((updates: Partial<RentalSearchParams>) => {
    setRentalParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    loading,
    setLoading,
    error,
    setError,
    clearError,
    carParams,
    updateCarParams,
    clientQuery,
    setClientQuery,
    rentalParams,
    updateRentalParams,
  };
}

