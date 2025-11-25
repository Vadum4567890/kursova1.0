import { Rental, RentalStatus } from '../../models/Rental.entity';

/**
 * Interface for Rental Repository
 */
export interface IRentalRepository {
  findAll(): Promise<Rental[]>;
  findById(id: number): Promise<Rental | null>;
  create(entity: Partial<Rental>): Promise<Rental>;
  update(id: number, entity: Partial<Rental>): Promise<Rental>;
  delete(id: number): Promise<boolean>;
  findActiveRentals(): Promise<Rental[]>;
  findByStatus(status: RentalStatus): Promise<Rental[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Rental[]>;
  findAllWithRelations(): Promise<Rental[]>;
  findByCarId(carId: number): Promise<Rental[]>;
  findByClientId(clientId: number): Promise<Rental[]>;
  getRepository(): any; // For query builder access (temporary)
}

