import { useState, useCallback } from 'react';

interface PasswordVisibilityState {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

/**
 * Hook to manage password visibility state
 */
export function usePasswordVisibility() {
  const [showPasswords, setShowPasswords] = useState<PasswordVisibilityState>({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePassword = useCallback((field: keyof PasswordVisibilityState) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const resetPasswords = useCallback(() => {
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  }, []);

  return {
    showPasswords,
    togglePassword,
    resetPasswords,
  };
}

