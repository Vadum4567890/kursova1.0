import { useState, useCallback } from 'react';

export interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsePagedResultOptions {
  initialLimit?: number;
}

/**
 * Shared hook for paginated search results
 * Handles loading, error, and pagination state
 */
export function usePagedResult<T>(options: UsePagedResultOptions = {}) {
  const { initialLimit = 12 } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: initialLimit,
    totalPages: 1,
  });

  const setResults = useCallback(
    (items: T[], meta?: Partial<PaginationState>) => {
      setData(items);
      if (meta) {
        setPagination((prev) => ({ ...prev, ...meta }));
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setError('');
    setPagination({
      total: 0,
      page: 1,
      limit: initialLimit,
      totalPages: 1,
    });
  }, [initialLimit]);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  }, []);

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    pagination,
    setPagination,
    setResults,
    reset,
    goToPage,
  };
}
