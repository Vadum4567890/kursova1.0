import { useState, useCallback } from 'react';
import { CarSearchParams, RentalSearchParams } from '../interfaces';

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [carParams, setCarParams] = useState<CarSearchParams>({ page: 1, limit: 12 });
  const [clientQuery, setClientQuery] = useState('');
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

