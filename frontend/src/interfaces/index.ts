/**
 * Central export file for all interfaces
 * 
 * Organization:
 * - entities.ts: Domain entities (Car, Rental, User, Client, Penalty)
 * - services.ts: Service DTOs (CreateCarData, UpdateRentalData, etc.)
 * - FormData files: Form-specific interfaces
 */
export * from './entities';
export * from './services';
export * from './ProfileFormData';
export * from './PasswordFormData';
export * from './PenaltyFormData';
export * from './RentalFormData';

