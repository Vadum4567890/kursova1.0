import { BaseRepository } from './BaseRepository';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { Repository } from 'typeorm';
import { IRentalRepository } from '../core/interfaces/IRentalRepository';

/**
 * Repository for working with rentals
 * Implements IRentalRepository interface
 */
export class RentalRepository extends BaseRepository<Rental> implements IRentalRepository {
  private get rentalRepository(): Repository<Rental> {
    return this.repository;
  }

  constructor() {
    super(Rental);
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

  /**
   * Find all rentals with relations loaded
   */
  async findAllWithRelations(): Promise<Rental[]> {
    return await this.rentalRepository.find({
      relations: ['client', 'car'],
    });
  }

  /**
   * Get repository instance for query builder access
   */
  getRepository() {
    return this.rentalRepository;
  }
}

