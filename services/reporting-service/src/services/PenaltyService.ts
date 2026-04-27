import { In, Repository } from 'typeorm';
import { Penalty } from '../entities/Penalty.entity';
import { Rental } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';

function isUuidString(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export class PenaltyService {
  private penaltyRepository: Repository<Penalty>;
  private rentalRepository: Repository<Rental>;

  constructor() {
    this.penaltyRepository = AppDataSource.getRepository(Penalty);
    this.rentalRepository = AppDataSource.getRepository(Rental);
  }

  async getAllPenalties(): Promise<Penalty[]> {
    return this.penaltyRepository.find({
      relations: ['rental'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Лише штрафи по прокатах поточного орендаря (ізоляція даних між акаунтами). */
  async getPenaltiesForRenter(renterUserId: string): Promise<Penalty[]> {
    if (!isUuidString(renterUserId)) {
      return [];
    }
    const rentals = await this.rentalRepository.find({
      where: { renterUserId },
    });
    const rentalIds = rentals.map((r) => r.id).filter(Boolean) as string[];
    if (rentalIds.length === 0) {
      return [];
    }
    return this.penaltyRepository.find({
      where: { rentalId: In(rentalIds) },
      relations: ['rental'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPenaltyById(id: string): Promise<Penalty | null> {
    return this.penaltyRepository.findOne({
      where: { id },
      relations: ['rental'],
    });
  }

  async getPenaltiesByRentalId(rentalId: string): Promise<Penalty[]> {
    return this.penaltyRepository.find({
      where: { rentalId },
      order: { date: 'DESC' },
    });
  }

  async getTotalPenaltyByRentalId(rentalId: string): Promise<number> {
    const penalties = await this.penaltyRepository.find({ where: { rentalId } });
    return penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  async createPenalty(rentalId: string, amount: number, reason: string): Promise<Penalty> {
    const rental = await this.rentalRepository.findOne({ where: { id: rentalId } });
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (amount <= 0) {
      throw new Error('Penalty amount must be greater than 0');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Penalty reason is required');
    }

    const penalty = this.penaltyRepository.create({
      rental,
      rentalId,
      amount,
      reason,
      date: new Date(),
    });
    const saved = await this.penaltyRepository.save(penalty);

    const totalPenalties = await this.getTotalPenaltyByRentalId(rentalId);
    await this.rentalRepository.update(rentalId, { penaltyAmount: totalPenalties });

    return saved;
  }

  async deletePenalty(id: string): Promise<void> {
    const penalty = await this.penaltyRepository.findOne({ where: { id }, relations: ['rental'] });
    if (!penalty) {
      throw new Error('Penalty not found');
    }

    await this.penaltyRepository.delete(id);

    if (penalty.rentalId) {
      const totalPenalties = await this.getTotalPenaltyByRentalId(penalty.rentalId);
      await this.rentalRepository.update(penalty.rentalId, { penaltyAmount: totalPenalties });
    }
  }
}

