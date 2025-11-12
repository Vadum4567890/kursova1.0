import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, Client } from '../../services/clientService';

const QUERY_KEYS = {
  all: ['clients'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...QUERY_KEYS.details(), id] as const,
  byPhone: (phone: string) => [...QUERY_KEYS.all, 'phone', phone] as const,
};

export const useClients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => clientService.getAllClients(),
  });
};

export const useClient = (id: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => clientService.getClientById(id!),
    enabled: !!id,
  });
};

export const useClientByPhone = (phone: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.byPhone(phone!),
    queryFn: () => clientService.getClientByPhone(phone!),
    enabled: !!phone,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientService.updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};

