import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { LoginData, RegisterData } from '../../interfaces';

const QUERY_KEYS = {
  all: ['auth'] as const,
  me: () => [...QUERY_KEYS.all, 'me'] as const,
};

export const useMe = () => {
  return useQuery({
    queryKey: QUERY_KEYS.me(),
    queryFn: () => authService.getMe(),
    retry: false,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email?: string; fullName?: string; address?: string }) =>
      authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me() });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(currentPassword, newPassword),
  });
};

