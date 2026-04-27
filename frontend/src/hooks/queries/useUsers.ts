import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';

const QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  byRole: (role: string) => [...QUERY_KEYS.all, 'role', role] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...QUERY_KEYS.details(), id] as const,
  rating: (id: number | string) => [...QUERY_KEYS.all, 'rating', id] as const,
};

export const useUsers = (role?: string) => {
  return useQuery({
    queryKey: role ? QUERY_KEYS.byRole(role) : QUERY_KEYS.list(),
    queryFn: () => (role ? userService.getUsersByRole(role) : userService.getAllUsers()),
  });
};

export const useUser = (id: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });
};

export const useUserRating = (id: number | string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.rating(id!),
    queryFn: () => userService.getUserRating(id!),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      userService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      userService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

