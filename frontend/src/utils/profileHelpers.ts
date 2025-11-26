/**
 * Utility functions for profile management
 */
import { ProfileFormData } from '../interfaces';

interface UserProfileData {
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
}

/**
 * Get initial profile form data from user object
 */
export function getInitialProfileData(user?: UserProfileData | null): ProfileFormData {
  return {
    email: user?.email || '',
    fullName: user?.fullName || '',
    address: user?.address || '',
    phone: user?.phone || '',
  };
}

