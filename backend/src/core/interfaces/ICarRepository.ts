import { Car, CarStatus, CarType } from '../../models/Car.entity';

/**
 * Interface for Car Repository
 * Defines contract for car data access operations
 */
export interface ICarRepository {
  findAll(): Promise<Car[]>;
  findById(id: number): Promise<Car | null>;
  create(entity: Partial<Car>): Promise<Car>;
  update(id: number, entity: Partial<Car>): Promise<Car>;
  delete(id: number): Promise<boolean>;
  findAvailableCars(): Promise<Car[]>;
  findByType(type: CarType): Promise<Car[]>;
  findByStatus(status: CarStatus): Promise<Car[]>;
  updateStatus(id: number, status: CarStatus): Promise<Car>;
  getRepository(): any; // For query builder access (temporary)
}

