import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

function buildChatWebSocketUrl(token: string): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const wsBase = base.replace(/^http/, 'ws');
  return `${wsBase}/rentals/ws?token=${encodeURIComponent(token)}`;
}

type ChatSocketContextValue = {
  subscribeTopics: (topics: string[]) => void;
  unsubscribeTopics: (topics: string[]) => void;
};

const RentalChatSocketContext = createContext<ChatSocketContextValue | null>(null);

export const RentalChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topicsRef = useRef<Set<string>>(new Set());

  const subscribeTopics = useCallback((topics: string[]) => {
    topics.forEach((t) => topicsRef.current.add(t));
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'subscribe', topics }));
    }
  }, []);

  const unsubscribeTopics = useCallback((topics: string[]) => {
    topics.forEach((t) => topicsRef.current.delete(t));
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', topics }));
    }
  }, []);

  useEffect(() => {
    if (!token || !user) {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      topicsRef.current.clear();
      return;
    }

    const handleMessage = (ev: MessageEvent) => {
      try {
        const d = JSON.parse(String(ev.data)) as Record<string, unknown>;
        if (d.type === 'unread_changed') {
          void queryClient.invalidateQueries({ queryKey: ['rentals', 'unread-chats'] });
          void queryClient.invalidateQueries({ queryKey: ['rentals', 'my-inquiry-chats'] });
          void queryClient.invalidateQueries({ queryKey: ['rentals', 'my'] });
        }
        if (d.type === 'chat_message') {
          if (d.kind === 'rental' && d.rentalId != null) {
            void queryClient.invalidateQueries({
              queryKey: ['rentals', 'messages', String(d.rentalId)],
            });
          }
          if (d.kind === 'inquiry' && d.carId != null) {
            void queryClient.invalidateQueries({
              queryKey: ['rentals', 'car-inquiry-messages', d.carId],
            });
            void queryClient.invalidateQueries({
              queryKey: ['rentals', 'car-inquiry-threads', d.carId],
            });
          }
          void queryClient.invalidateQueries({ queryKey: ['rentals', 'unread-chats'] });
        }
      } catch {
        /* ignore */
      }
    };

    const connect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      const ws = new WebSocket(buildChatWebSocketUrl(token));
      wsRef.current = ws;
      ws.onopen = () => {
        const subs = [...topicsRef.current];
        if (subs.length) {
          ws.send(JSON.stringify({ type: 'subscribe', topics: subs }));
        }
      };
      ws.onmessage = handleMessage;
      ws.onclose = () => {
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token, user, queryClient]);

  const value = useMemo<ChatSocketContextValue>(
    () => ({ subscribeTopics, unsubscribeTopics }),
    [subscribeTopics, unsubscribeTopics]
  );

  return (
    <RentalChatSocketContext.Provider value={value}>{children}</RentalChatSocketContext.Provider>
  );
};

export function useRentalChatSocket(): ChatSocketContextValue {
  const ctx = useContext(RentalChatSocketContext);
  if (!ctx) {
    return {
      subscribeTopics: () => {},
      unsubscribeTopics: () => {},
    };
  }
  return ctx;
}
