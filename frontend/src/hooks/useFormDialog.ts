import { useState, useCallback } from 'react';

interface UseFormDialogOptions<T> {
  initialData: T;
  onSuccess?: () => void;
}

export function useFormDialog<T extends Record<string, any>>(
  options: UseFormDialogOptions<T>
) {
  const { initialData, onSuccess } = options;
  
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<T>(initialData);
  const [error, setError] = useState('');

  const openDialog = useCallback((item?: T) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData(initialData);
    }
    setError('');
    setOpen(true);
  }, [initialData]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setEditingItem(null);
    setFormData(initialData);
    setError('');
  }, [initialData]);

  const handleSuccess = useCallback(() => {
    closeDialog();
    onSuccess?.();
  }, [closeDialog, onSuccess]);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    open,
    editingItem,
    formData,
    error,
    setError,
    openDialog,
    closeDialog,
    handleSuccess,
    updateFormData,
    isEditing: editingItem !== null,
  };
}

