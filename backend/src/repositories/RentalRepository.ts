import { BaseRepository } from './BaseRepository';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { Repository } from 'typeorm';
import { DatabaseConnection } from '../database/DatabaseConnection';

/**
 * Repository for working with rentals
 */
export class RentalRepository extends BaseRepository<Rental> {
  private rentalRepository: Repository<Rental>;

  constructor() {
    super(Rental);
    const dataSource = DatabaseConnection.getInstance().getDataSource();
    this.rentalRepository = dataSource.getRepository(Rental);
  }

  /**
   * Find all active rentals
   */
  async findActiveRentals(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status: RentalStatus.ACTIVE } as any,
      relations: ['client', 'car'],
    });
  }

  /**
   * Find rentals by client ID
   */
  async findByClientId(clientId: number): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { client: { id: clientId } } as any,
      relations: ['client', 'car'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find rentals by car ID
   */
  async findByCarId(carId: number): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { car: { id: carId } } as any,
      relations: ['client', 'car'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find rentals by status
   */
  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    return await this.rentalRepository.find({
      where: { status } as any,
      relations: ['client', 'car'],
    });
  }

  /**
   * Find rentals by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return await this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.client', 'client')
      .leftJoinAndSelect('rental.car', 'car')
      .where('rental.startDate >= :startDate', { startDate })
      .andWhere('rental.startDate <= :endDate', { endDate })
      .getMany();
  }
}

