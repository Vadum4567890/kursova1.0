import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState('');

  const handleError = useCallback((err: any, defaultMessage = 'Помилка') => {
    const d = err?.response?.data;
    const nested =
      (typeof d?.error === 'object' && d?.error?.message) ||
      (typeof d?.error === 'string' ? d.error : null) ||
      d?.message;
    const errorMessage = nested || err?.message || defaultMessage;
    setError(typeof errorMessage === 'string' ? errorMessage : defaultMessage);
    return typeof errorMessage === 'string' ? errorMessage : defaultMessage;
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

