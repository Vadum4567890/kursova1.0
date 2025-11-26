/**
 * Common types used across the application
 */

export type UserRole = 'admin' | 'manager' | 'employee' | 'user';

export type CarStatus = 'available' | 'rented' | 'maintenance';
export type RentalStatus = 'active' | 'completed' | 'cancelled';

export interface BaseEntity {
  id: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TableAction<T = any> {
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: (item: T) => boolean;
  show?: (item: T) => boolean;
}

