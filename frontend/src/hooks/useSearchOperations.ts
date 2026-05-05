import { useState, useCallback } from 'react';
import { searchService } from '../services/searchService';
import { Car, Client, Rental, CarSearchParams, RentalSearchParams } from '../interfaces';
import { useApiError } from './useApiError';

const SEARCH_FAIL = 'Помилка пошуку';

export function useSearchOperations() {
  const { getErrorMessage } = useApiError();
  const [carResults, setCarResults] = useState<Car[]>([]);
  const [carPagination, setCarPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [rentalResults, setRentalResults] = useState<Rental[]>([]);

  const searchCars = useCallback(async (params: CarSearchParams, setLoading: (value: boolean) => void, setError: (value: string) => void) => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchCars(params);
      setCarResults(results.cars);
      setCarPagination({
        total: results.total,
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
      });
    } catch (err: any) {
      setError(getErrorMessage(err) || SEARCH_FAIL);
      setCarResults([]);
      setCarPagination({ total: 0, page: 1, limit: 12, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  const searchClients = useCallback(async (query: string, setLoading: (value: boolean) => void, setError: (value: string) => void) => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchClients(query);
      setClientResults(results);
    } catch (err: any) {
      setError(getErrorMessage(err) || SEARCH_FAIL);
      setClientResults([]);
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
      setError(getErrorMessage(err) || SEARCH_FAIL);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    carResults,
    carPagination,
    clientResults,
    rentalResults,
    searchCars,
    searchClients,
    searchRentals,
  };
}

