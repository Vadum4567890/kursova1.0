import { Rental, RentalStatus } from '../../models/Rental.entity';

/**
 * Interface for Rental Service
 */
export interface IRentalService {
  createRental(
    clientId: number,
    carId: number,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental>;
  
  completeRental(rentalId: number, actualEndDate?: Date | string): Promise<Rental>;
  
  cancelRental(rentalId: number, cancellationDate?: Date | string): Promise<Rental>;
  
  getRentalById(id: number): Promise<Rental | null>;
  
  getAllRentals(): Promise<Rental[]>;
  
  getRentalsByClientId(clientId: number): Promise<Rental[]>;
  
  getRentalsByCarId(carId: number): Promise<Rental[]>;
  
  getBookedDates(carId: number): Promise<any[]>;
  
  getRentalsForUser(userId: number, userEmail: string, userFullName?: string): Promise<Rental[]>;
  
  createBookingForUser(userId: number, userEmail: string, userFullName: string | undefined, carId: number, startDate: Date, expectedEndDate: Date): Promise<Rental>;
  
  getOrCreateClientForUser(userId: number, userEmail: string, userFullName?: string): Promise<any>;
  
  getActiveRentals(): Promise<Rental[]>;
  
  addPenalty(rentalId: number, amount: number, reason: string): Promise<any>;
}

