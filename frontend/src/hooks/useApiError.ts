import { useCallback } from 'react';

export interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}

/**
 * Shared hook for handling API errors
 * Normalizes error responses from different services
 */
export function useApiError() {
  const extractError = useCallback((error: any): ApiError => {
    // New unified error format
    if (error?.response?.data?.error) {
      const err = error.response.data.error;
      return {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'Unknown error',
        details: err.details,
      };
    }

    // Legacy error formats
    if (error?.response?.data?.message) {
      return {
        message: error.response.data.message,
      };
    }

    if (error?.message) {
      return {
        message: error.message,
      };
    }

    return {
      message: 'Unknown error occurred',
    };
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    const apiError = extractError(error);
    return apiError.message;
  }, [extractError]);

  const isNetworkError = useCallback((error: any): boolean => {
    return !error?.response || error?.code === 'ECONNABORTED';
  }, []);

  const isClientError = useCallback((error: any): boolean => {
    return error?.response?.status >= 400 && error?.response?.status < 500;
  }, []);

  const isServerError = useCallback((error: any): boolean => {
    return error?.response?.status >= 500;
  }, []);

  return {
    extractError,
    getErrorMessage,
    isNetworkError,
    isClientError,
    isServerError,
  };
}
