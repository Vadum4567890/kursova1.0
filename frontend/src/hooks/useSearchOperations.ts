import { useState, useCallback } from 'react';
import { searchService } from '../services/searchService';
import { Car, Client, Rental, CarSearchParams, RentalSearchParams } from '../interfaces';

/**
 * Hook for performing search operations
 */
export function useSearchOperations() {
  const [carResults, setCarResults] = useState<Car[]>([]);
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [rentalResults, setRentalResults] = useState<Rental[]>([]);

  const searchCars = useCallback(async (params: CarSearchParams, setLoading: (value: boolean) => void, setError: (value: string) => void) => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchCars(params);
      setCarResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchClients = useCallback(async (query: string, setLoading: (value: boolean) => void, setError: (value: string) => void) => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchClients(query);
      setClientResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchRentals = useCallback(async (params: RentalSearchParams, setLoading: (value: boolean) => void, setError: (value: string) => void) => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchRentals(params);
      setRentalResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    carResults,
    clientResults,
    rentalResults,
    searchCars,
    searchClients,
    searchRentals,
  };
}

