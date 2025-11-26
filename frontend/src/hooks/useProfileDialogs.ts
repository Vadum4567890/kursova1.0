import { useEffect } from 'react';
import { useFormDialog } from './useFormDialog';
import { ProfileFormData, PasswordFormData } from '../interfaces';
import { getInitialProfileData } from '../utils/profileHelpers';

interface UserProfile {
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
}

/**
 * Hook to manage profile and password dialogs
 */
export function useProfileDialogs(user?: UserProfile | null) {
  const profileDialog = useFormDialog<ProfileFormData>({
    initialData: getInitialProfileData(user),
  });

  const passwordDialog = useFormDialog<PasswordFormData>({
    initialData: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user && !profileDialog.open) {
      profileDialog.updateFormData(getInitialProfileData(user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openProfileDialog = () => {
    profileDialog.openDialog();
    if (user) {
      profileDialog.updateFormData(getInitialProfileData(user));
    }
  };

  return {
    profileDialog,
    passwordDialog,
    openProfileDialog,
  };
}

