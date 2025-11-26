import { useCallback } from 'react';
import { useUIStore } from '../stores';

interface UseDeleteConfirmOptions {
  onConfirm: (id: number) => Promise<void>;
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

  const handleDeleteClick = useCallback((id: number, type: 'car' | 'client' | 'rental' | 'penalty' | 'user' = 'car') => {
    openDeleteDialog(id, type);
  }, [openDeleteDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialogItemId) return;
    
    try {
      await onConfirm(deleteDialogItemId);
      closeDeleteDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Помилка видалення';
      onError?.(errorMessage);
      closeDeleteDialog();
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

