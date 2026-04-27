import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customerService';
import { Client } from '../../interfaces';

const QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...QUERY_KEYS.details(), id] as const,
  byPhone: (phone: string) => [...QUERY_KEYS.all, 'phone', phone] as const,
};

export const useCustomers = () =>
  useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => customerService.getAll(),
  });

export const useCustomer = (id: number | string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => customerService.getById(id!),
    enabled: !!id,
  });

export const useCustomerByPhone = (phone: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.byPhone(phone!),
    queryFn: () => customerService.getByPhone(phone!),
    enabled: !!phone,
  });

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Client>) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Client> }) =>
      customerService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => customerService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};
