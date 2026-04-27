import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { rentalService } from '../../services/rentalService';
export function useUnreadChatsSummary() {
  const { user, token } = useAuth();
  const sessionKey = token ? token.slice(-32) : 'none';

  return useQuery({
    queryKey: ['rentals', 'unread-chats', user?.id ?? 'none', sessionKey],
    queryFn: () => rentalService.getUnreadChatsSummary(),
    enabled: !!user && !!token,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
