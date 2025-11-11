import { BaseRepository } from './BaseRepository';
import { Car, CarStatus } from '../models/Car.entity';

/**
 * Repository for working with cars
 * Extends BaseRepository with specific methods for Car
 */
export class CarRepository extends BaseRepository<Car> {
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
  async findByType(type: string): Promise<Car[]> {
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
}

