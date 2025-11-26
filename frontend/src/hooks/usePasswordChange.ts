import { useCallback } from 'react';
import { useChangePassword } from './queries/useAuth';
import { useErrorHandler } from './useErrorHandler';
import { PasswordFormData } from '../interfaces';

interface UsePasswordChangeOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const MIN_PASSWORD_LENGTH = 6;

export function usePasswordChange(options: UsePasswordChangeOptions = {}) {
  const { onSuccess, onError } = options;
  const changePassword = useChangePassword();
  const { error, handleError, clearError } = useErrorHandler();

  const validatePassword = useCallback((formData: PasswordFormData): string | null => {
    if (formData.newPassword !== formData.confirmPassword) {
      return 'Нові паролі не співпадають';
    }

    if (formData.newPassword.length < MIN_PASSWORD_LENGTH) {
      return `Пароль повинен містити мінімум ${MIN_PASSWORD_LENGTH} символів`; // Keep dynamic message for this hook
    }

    return null;
  }, []);

  const change = useCallback(
    async (formData: PasswordFormData) => {
      const validationError = validatePassword(formData);
      if (validationError) {
        const error = new Error(validationError);
        handleError(error, validationError);
        onError?.(validationError);
        throw error;
      }

      try {
        clearError();
        await changePassword.mutateAsync({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        });
        const successMessage = 'Пароль успішно змінено';
        onSuccess?.(successMessage);
        return successMessage;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка зміни пароля';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [changePassword, validatePassword, clearError, handleError, onSuccess, onError]
  );

  return {
    change,
    error,
    clearError,
    isPending: changePassword.isPending,
  };
}

