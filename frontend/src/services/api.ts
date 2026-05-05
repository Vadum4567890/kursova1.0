import axios, { AxiosError } from 'axios';
import { queryClient } from '../lib/queryClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/** Немає HTTP-відповіді: обірване з'єднання, сервер не слухає, порожня відповідь тощо (не CORS). */
function isTransportLayerError(error: AxiosError): boolean {
  if (error.response) return false;
  const c = error.code;
  const m = (error.message || '').toLowerCase();
  return (
    c === 'ERR_NETWORK' ||
    c === 'ECONNREFUSED' ||
    c === 'ECONNRESET' ||
    c === 'ETIMEDOUT' ||
    c === 'EPIPE' ||
    c === 'ENOTFOUND' ||
    m.includes('err_connection_refused') ||
    m.includes('err_socket_not_connected') ||
    m.includes('err_empty_response') ||
    m.includes('network error') ||
    m.includes('failed to fetch')
  );
}

function isConnectionRefused(error: AxiosError): boolean {
  const c = error.code;
  const m = error.message || '';
  return c === 'ECONNREFUSED' || m.includes('ERR_CONNECTION_REFUSED');
}

// Create axios instance with timeout
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // multipart / повільний proxy можуть перевищувати 10s
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (isTransportLayerError(error)) {
      const refused = isConnectionRefused(error);
      const empty =
        (error.message || '').includes('ERR_EMPTY_RESPONSE') ||
        (error.message || '').includes('ERR_SOCKET_NOT_CONNECTED');

      if (refused) {
        console.error(
          '[API] Connection refused — на порту 3000 нічого не слухає. Запустіть api-gateway (`services/api-gateway`: npm run dev) або Docker. baseURL:',
          API_URL
        );
      } else if (empty) {
        console.error(
          '[API] Порожня відповідь / обірване сокет-з\'єднання — зазвичай api-gateway або upstream (rental/user/reporting) впав, перезапустився або не встиг відповісти. Перевірте консоль процесу gateway і логи Docker; перезапустіть стек. baseURL:',
          API_URL
        );
      } else {
        console.error(
          '[API] Немає відповіді від сервера (транспортна помилка, не CORS). Переконайтеся, що api-gateway стабільно працює на :3000 і всі потрібні мікросервіси запущені. baseURL:',
          API_URL
        );
      }

      return Promise.reject(
        new Error(
          refused
            ? 'Сервер API не відповідає (чи запущений api-gateway на :3000?).'
            : 'З\'єднання з API перервано або сервер повернув порожню відповідь. Перезапустіть api-gateway і залежні сервіси.'
        )
      );
    }
    
    if (error.response?.status === 401) {
      // Unauthorized — скинути кеш React Query (інакше «Мої авто» показує дані попереднього юзера)
      queryClient.clear();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

