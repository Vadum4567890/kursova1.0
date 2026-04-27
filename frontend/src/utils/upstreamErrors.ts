import axios from 'axios';
import type { Car } from '../interfaces';
import type { PaginatedResponse } from '../types/common';

/**
 * Car/rental/reporting ще не піднялися, gateway повернув 502, або з’єднання зірвалося.
 * Для GET-списків повертаємо порожні дані замість червоної помилки в UI.
 */
export function isUpstreamUnavailable(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;
    if (s === 502 || s === 503 || s === 504) return true;
    if (!err.response) return true;
    return false;
  }
  if (err instanceof Error) {
    const m = err.message;
    return (
      m.includes('Сервер недоступний') ||
      m.includes('Network Error') ||
      m.includes('ECONNREFUSED') ||
      m.includes('ERR_NETWORK') ||
      m.includes('timeout')
    );
  }
  return false;
}

export function emptyCarPaginated(): PaginatedResponse<Car> {
  return { data: [], total: 0, page: 1, limit: 0, totalPages: 0 };
}

export function emptyMyCars(): { data: Car[]; count: number } {
  return { data: [], count: 0 };
}
