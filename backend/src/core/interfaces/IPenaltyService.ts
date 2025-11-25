import { Penalty } from '../../models/Penalty.entity';

/**
 * Interface for Penalty Service
 */
export interface IPenaltyService {
  getAllPenalties(): Promise<Penalty[]>;
  getPenaltyById(id: number): Promise<Penalty | null>;
  updatePenalty(id: number, data: Partial<Penalty>): Promise<Penalty>;
  deletePenalty(id: number): Promise<boolean>;
  getPenaltiesByRentalId(rentalId: number): Promise<Penalty[]>;
  getTotalPenaltyByRentalId(rentalId: number): Promise<number>;
  createPenalty(rentalId: number, amount: number, reason: string): Promise<Penalty>;
}

