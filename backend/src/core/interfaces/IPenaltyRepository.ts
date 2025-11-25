import { Penalty } from '../../models/Penalty.entity';

/**
 * Interface for Penalty Repository
 */
export interface IPenaltyRepository {
  findAll(): Promise<Penalty[]>;
  findById(id: number): Promise<Penalty | null>;
  create(entity: Partial<Penalty>): Promise<Penalty>;
  update(id: number, entity: Partial<Penalty>): Promise<Penalty>;
  delete(id: number): Promise<boolean>;
  findByRentalId(rentalId: number): Promise<Penalty[]>;
  findAllWithRelations(): Promise<Penalty[]>;
  getTotalByRentalId(rentalId: number): Promise<number>;
}

