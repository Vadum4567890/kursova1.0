import axios, { AxiosError } from 'axios';
import { queryClient } from '../lib/queryClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    // Handle connection errors
    if (
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('Network Error'))
    ) {
      console.error('Backend server is not available. Please make sure the server is running on port 3000.');
      // Don't redirect on connection errors, just log
      return Promise.reject(new Error('Сервер недоступний. Переконайтеся, що backend сервер запущений на порту 3000.'));
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

