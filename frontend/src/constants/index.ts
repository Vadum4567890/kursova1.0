/**
 * Application constants
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  USER: 'user',
} as const;

export const CAR_STATUSES = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
} as const;

export const RENTAL_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const CAR_TYPES = {
  ECONOMY: 'economy',
  STANDARD: 'standard',
  LUXURY: 'luxury',
  SUV: 'suv',
  SPORTS: 'sports',
} as const;

export const DATE_FORMAT = 'DD.MM.YYYY';
export const DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_LIMIT_CARS: 12,
} as const;

