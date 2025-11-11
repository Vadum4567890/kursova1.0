import { BaseRepository } from './BaseRepository';
import { Penalty } from '../models/Penalty.entity';
import { Repository } from 'typeorm';
import { DatabaseConnection } from '../database/DatabaseConnection';

/**
 * Repository for working with penalties
 */
export class PenaltyRepository extends BaseRepository<Penalty> {
  private penaltyRepository: Repository<Penalty>;

  constructor() {
    super(Penalty);
    const dataSource = DatabaseConnection.getInstance().getDataSource();
    this.penaltyRepository = dataSource.getRepository(Penalty);
  }

  /**
   * Find penalties by rental ID
   */
  async findByRentalId(rentalId: number): Promise<Penalty[]> {
    return await this.penaltyRepository.find({
      where: { rental: { id: rentalId } } as any,
      relations: ['rental'],
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

