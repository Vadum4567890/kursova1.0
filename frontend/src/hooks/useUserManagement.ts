import { useCallback } from 'react';
import { useCreateUser, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from './queries/useUsers';
import { useErrorHandler } from './useErrorHandler';
import { CreateUserData } from '../interfaces';
import { MIN_PASSWORD_LENGTH, PASSWORD_VALIDATION_MESSAGE } from '../constants/validation';

interface UseUserManagementOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useUserManagement(options: UseUserManagementOptions = {}) {
  const { onSuccess, onError } = options;
  const { error, handleError, clearError } = useErrorHandler();

  const createUser = useCreateUser();
  const updateUserRole = useUpdateUserRole();
  const updateUserStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const create = useCallback(
    async (formData: CreateUserData) => {
      if (!formData.username || !formData.email || !formData.password) {
        const errorMessage = "Логін, email та пароль обов'язкові";
        handleError(new Error(errorMessage), errorMessage);
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      if (formData.password.length < MIN_PASSWORD_LENGTH) {
        const errorMessage = PASSWORD_VALIDATION_MESSAGE;
        handleError(new Error(errorMessage), errorMessage);
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        clearError();
        await createUser.mutateAsync(formData);
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка створення користувача';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [createUser, clearError, handleError, onSuccess, onError]
  );

  const updateRole = useCallback(
    async (id: number, role: string) => {
      try {
        clearError();
        await updateUserRole.mutateAsync({ id, role });
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка оновлення ролі';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [updateUserRole, clearError, handleError, onSuccess, onError]
  );

  const updateStatus = useCallback(
    async (id: number, isActive: boolean) => {
      try {
        clearError();
        await updateUserStatus.mutateAsync({ id, isActive });
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка оновлення статусу';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [updateUserStatus, clearError, handleError, onSuccess, onError]
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        clearError();
        await deleteUser.mutateAsync(id);
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка видалення';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [deleteUser, clearError, handleError, onSuccess, onError]
  );

  return {
    create,
    updateRole,
    updateStatus,
    remove,
    error,
    clearError,
    isPending: createUser.isPending || updateUserRole.isPending || updateUserStatus.isPending || deleteUser.isPending,
  };
}

