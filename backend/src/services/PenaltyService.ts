import { PenaltyRepository } from '../repositories/PenaltyRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { Penalty } from '../models/Penalty.entity';

/**
 * Service for penalty management
 * Contains business logic for penalty operations
 */
export class PenaltyService {
  private penaltyRepository: PenaltyRepository;
  private rentalRepository: RentalRepository;

  constructor() {
    this.penaltyRepository = new PenaltyRepository();
    this.rentalRepository = new RentalRepository();
  }

  /**
   * Get all penalties with relations (rental, client, car)
   */
  async getAllPenalties(): Promise<Penalty[]> {
    return await this.penaltyRepository.findAllWithRelations();
  }

  /**
   * Get penalty by ID with relations
   */
  async getPenaltyById(id: number): Promise<Penalty | null> {
    const penalty = await this.penaltyRepository.findById(id);
    if (!penalty) return null;
    
    // Load relations if not already loaded
    if (!penalty.rental) {
      const penalties = await this.penaltyRepository.findAllWithRelations();
      return penalties.find(p => p.id === id) || penalty;
    }
    
    return penalty;
  }

  /**
   * Get penalties by rental ID with relations
   */
  async getPenaltiesByRentalId(rentalId: number): Promise<Penalty[]> {
    return await this.penaltyRepository.findByRentalId(rentalId);
  }

  /**
   * Get total penalty amount for a rental
   */
  async getTotalPenaltyByRentalId(rentalId: number): Promise<number> {
    return await this.penaltyRepository.getTotalByRentalId(rentalId);
  }

  /**
   * Create a new penalty
   */
  async createPenalty(rentalId: number, amount: number, reason: string): Promise<Penalty> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (amount <= 0) {
      throw new Error('Penalty amount must be greater than 0');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Penalty reason is required');
    }

    const penalty = await this.penaltyRepository.create({
      rental,
      amount,
      reason,
      date: new Date(),
    } as Partial<Penalty>);

    // Update rental total penalty amount
    const totalPenalties = await this.penaltyRepository.getTotalByRentalId(rentalId);
    await this.rentalRepository.update(rentalId, {
      penaltyAmount: totalPenalties,
    } as Partial<import('../models/Rental.entity').Rental>);

    return penalty;
  }

  /**
   * Delete penalty
   */
  async deletePenalty(id: number): Promise<boolean> {
    const penalty = await this.penaltyRepository.findById(id);
    if (!penalty) {
      throw new Error('Penalty not found');
    }

    const result = await this.penaltyRepository.delete(id);

    // Update rental total penalty amount
    if (penalty.rental) {
      const totalPenalties = await this.penaltyRepository.getTotalByRentalId(penalty.rental.id);
      await this.rentalRepository.update(penalty.rental.id, {
        penaltyAmount: totalPenalties,
      } as Partial<import('../models/Rental.entity').Rental>);
    }

    return result;
  }
}

