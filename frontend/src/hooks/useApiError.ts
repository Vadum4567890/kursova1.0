import { useCallback } from 'react';

export interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}

/** Нормалізує axios/API помилки до одного вигляду. */
export function useApiError() {
  const extractError = useCallback((error: any): ApiError => {
    if (error?.response?.data?.error != null) {
      const e = error.response.data.error;
      if (typeof e === 'string') {
        return { message: e };
      }
      if (typeof e === 'object') {
        return {
          code: e.code || 'UNKNOWN_ERROR',
          message: e.detail || e.message || 'Unknown error',
          details: e.details,
        };
      }
    }

    if (error?.response?.data?.message) {
      return { message: error.response.data.message };
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
