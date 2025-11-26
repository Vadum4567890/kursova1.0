import { useState, useCallback } from 'react';

interface UseSuccessMessageOptions {
  autoHideDelay?: number;
}

/**
 * Hook to manage success messages with auto-hide functionality
 */
export function useSuccessMessage(options: UseSuccessMessageOptions = {}) {
  const { autoHideDelay = 3000 } = options;
  const [success, setSuccess] = useState('');

  const showSuccess = useCallback(
    (message: string) => {
      setSuccess(message);
      if (autoHideDelay > 0) {
        setTimeout(() => setSuccess(''), autoHideDelay);
      }
    },
    [autoHideDelay]
  );

  const clearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  return {
    success,
    showSuccess,
    clearSuccess,
  };
}

