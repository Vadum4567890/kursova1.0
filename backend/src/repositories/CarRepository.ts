import { BaseRepository } from './BaseRepository';
import { Car, CarStatus, CarType } from '../models/Car.entity';
import { ICarRepository } from '../core/interfaces/ICarRepository';

/**
 * Repository for working with cars
 * Extends BaseRepository with specific methods for Car
 * Implements ICarRepository interface
 */
export class CarRepository extends BaseRepository<Car> implements ICarRepository {
  constructor() {
    super(Car);
  }

  /**
   * Find all available cars
   */
  async findAvailableCars(): Promise<Car[]> {
    return await this.repository.find({
      where: { status: CarStatus.AVAILABLE } as any,
    });
  }

  /**
   * Find cars by type
   */
  async findByType(type: CarType): Promise<Car[]> {
    return await this.repository.find({
      where: { type } as any,
    });
  }

  /**
   * Find cars by status
   */
  async findByStatus(status: CarStatus): Promise<Car[]> {
    return await this.repository.find({
      where: { status } as any,
    });
  }

  /**
   * Update car status
   */
  async updateStatus(id: number, status: CarStatus): Promise<Car> {
    return await this.update(id, { status } as Partial<Car>);
  }

  /**
   * Get repository instance for query builder access
   */
  getRepository() {
    return this.repository;
  }
}

