import { BaseRepository } from './BaseRepository';
import { Penalty } from '../models/Penalty.entity';
import { Repository } from 'typeorm';

/**
 * Repository for working with penalties
 */
export class PenaltyRepository extends BaseRepository<Penalty> {
  private get penaltyRepository(): Repository<Penalty> {
    return this.repository;
  }

  constructor() {
    super(Penalty);
  }

  /**
   * Find penalties by rental ID
   */
  async findByRentalId(rentalId: number): Promise<Penalty[]> {
    return await this.penaltyRepository.find({
      where: { rental: { id: rentalId } } as any,
      relations: ['rental', 'rental.client', 'rental.car'],
    });
  }

  /**
   * Find all penalties with relations
   */
  async findAllWithRelations(): Promise<Penalty[]> {
    return await this.penaltyRepository.find({
      relations: ['rental', 'rental.client', 'rental.car'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Calculate total penalty amount for a rental
   */
  async getTotalByRentalId(rentalId: number): Promise<number> {
    const result = await this.penaltyRepository
      .createQueryBuilder('penalty')
      .select('SUM(penalty.amount)', 'total')
      .where('penalty.rental_id = :rentalId', { rentalId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}

