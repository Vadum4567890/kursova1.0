import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState('');

  const handleError = useCallback((err: any, defaultMessage = 'Помилка') => {
    const errorMessage = err.response?.data?.error || err.message || defaultMessage;
    setError(errorMessage);
    return errorMessage;
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
}

