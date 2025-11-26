import { useCallback } from 'react';
import { useCreateCar, useUpdateCar, useDeleteCar } from './queries/useCars';
import { useErrorHandler } from './useErrorHandler';
import { useImageUpload } from './useImageUpload';
import { Car } from '../interfaces';
import { prepareCarDataForSubmit } from '../utils/carHelpers';

interface UseCarManagementOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCarManagement(options: UseCarManagementOptions = {}) {
  const { onSuccess, onError } = options;
  const { error, handleError, clearError } = useErrorHandler();
  const imageUpload = useImageUpload({ onError: handleError });

  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();

  const create = useCallback(
    async (formData: Partial<Car>, finalImageUrl?: string, finalImageUrls?: string[]) => {
      try {
        clearError();
        const dataToSubmit = prepareCarDataForSubmit(formData, finalImageUrl, finalImageUrls);
        await createCar.mutateAsync(dataToSubmit);
        imageUpload.reset();
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка створення автомобіля';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [createCar, clearError, handleError, onSuccess, onError, imageUpload]
  );

  const update = useCallback(
    async (id: number, formData: Partial<Car>, finalImageUrl?: string, finalImageUrls?: string[]) => {
      try {
        clearError();
        const dataToSubmit = prepareCarDataForSubmit(formData, finalImageUrl, finalImageUrls);
        const updatedCar = await updateCar.mutateAsync({ id, data: dataToSubmit });
        imageUpload.reset();
        onSuccess?.();
        return updatedCar;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка оновлення автомобіля';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [updateCar, clearError, handleError, onSuccess, onError, imageUpload]
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        clearError();
        await deleteCar.mutateAsync(id);
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Помилка видалення';
        handleError(err, errorMessage);
        onError?.(errorMessage);
        throw err;
      }
    },
    [deleteCar, clearError, handleError, onSuccess, onError]
  );

  return {
    create,
    update,
    remove,
    error,
    clearError,
    handleError,
    imageUpload,
    isPending: createCar.isPending || updateCar.isPending || deleteCar.isPending,
  };
}

