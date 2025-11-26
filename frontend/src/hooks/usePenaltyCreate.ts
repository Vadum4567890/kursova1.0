import { useCallback } from 'react';
import { useCreatePenalty } from './queries/usePenalties';
import { useErrorHandler } from './useErrorHandler';
import { PenaltyFormData } from '../interfaces';

interface UsePenaltyCreateOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePenaltyCreate(options: UsePenaltyCreateOptions = {}) {
  const { onSuccess, onError } = options;
  const createPenalty = useCreatePenalty();
  const { error, handleError, clearError } = useErrorHandler();

  const create = useCallback(
    async (formData: PenaltyFormData) => {
      try {
        clearError();
        await createPenalty.mutateAsync({
          rentalId: parseInt(formData.rentalId),
          amount: parseFloat(formData.amount),
          reason: formData.reason,
        });
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка створення штрафу';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [createPenalty, clearError, handleError, onSuccess, onError]
  );

  return {
    create,
    error,
    clearError,
    isPending: createPenalty.isPending,
  };
}

