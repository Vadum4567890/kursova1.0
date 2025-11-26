import { useCallback } from 'react';
import { useUpdateProfile } from './queries/useAuth';
import { useErrorHandler } from './useErrorHandler';
import { ProfileFormData } from '../interfaces';

interface UseProfileUpdateOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  refreshUser?: () => Promise<void>;
}

export function useProfileUpdate(options: UseProfileUpdateOptions = {}) {
  const { onSuccess, onError, refreshUser } = options;
  const updateProfile = useUpdateProfile();
  const { error, handleError, clearError } = useErrorHandler();

  const update = useCallback(
    async (formData: ProfileFormData) => {
      try {
        clearError();
        await updateProfile.mutateAsync(formData);
        if (refreshUser) {
          await refreshUser();
        }
        const successMessage = 'Профіль успішно оновлено';
        onSuccess?.(successMessage);
        return successMessage;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка оновлення профілю';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [updateProfile, refreshUser, clearError, handleError, onSuccess, onError]
  );

  return {
    update,
    error,
    clearError,
    isPending: updateProfile.isPending,
  };
}

