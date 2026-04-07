import { useCallback } from 'react';
import { useUIStore } from '../stores';

interface UseDeleteConfirmOptions {
  onConfirm: (id: number | string) => Promise<void>;
  onError?: (error: string) => void;
}

export function useDeleteConfirm(options: UseDeleteConfirmOptions) {
  const { onConfirm, onError } = options;
  const { 
    deleteDialogOpen, 
    deleteDialogItemId, 
    openDeleteDialog, 
    closeDeleteDialog 
  } = useUIStore();

  const handleDeleteClick = useCallback((id: number | string, type: 'car' | 'client' | 'rental' | 'penalty' | 'user' = 'car') => {
    openDeleteDialog(id, type);
  }, [openDeleteDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialogItemId) return;

    try {
      await onConfirm(deleteDialogItemId);
      closeDeleteDialog();
    } catch (err: any) {
      const d = err.response?.data;
      const msg =
        (typeof d?.error === 'object' && d?.error?.message) ||
        (typeof d?.error === 'string' ? d.error : null) ||
        d?.message ||
        err.message ||
        'Помилка видалення';
      const errorMessage = typeof msg === 'string' ? msg : String(msg);
      onError?.(errorMessage);
      /* діалог лишаємо відкритим, щоб можна було повторити або прочитати помилку в ErrorAlert */
    }
  }, [deleteDialogItemId, onConfirm, onError, closeDeleteDialog]);

  return {
    deleteDialogOpen,
    deleteDialogItemId,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  };
}

