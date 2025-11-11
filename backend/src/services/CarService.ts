import { CarRepository } from '../repositories/CarRepository';
import { Car, CarType, CarStatus } from '../models/Car.entity';
import { CarFactory, CarFactoryProvider, CarData } from '../patterns/factory/CarFactory';

/**
 * Service for car management
 * Contains business logic for car operations
 */
export class CarService {
  private carRepository: CarRepository;

  constructor() {
    this.carRepository = new CarRepository();
  }

  /**
   * Get all cars with pagination and filtering
   */
  async getAllCars(
    pagination?: { page: number; limit: number; offset: number },
    filters?: { [key: string]: any },
    sort?: { field: string; order: 'ASC' | 'DESC' }
  ): Promise<any> {
    if (!pagination) {
      // Return all without pagination (backward compatibility)
      return await this.carRepository.findAll();
    }

    // Apply filters and get total count
    const query = this.carRepository['repository'].createQueryBuilder('car');
    
    if (filters?.type) {
      query.andWhere('car.type = :type', { type: filters.type });
    }
    if (filters?.status) {
      query.andWhere('car.status = :status', { status: filters.status });
    }
    if (filters?.brand) {
      query.andWhere('car.brand ILIKE :brand', { brand: `%${filters.brand}%` });
    }
    if (filters?.model) {
      query.andWhere('car.model ILIKE :model', { model: `%${filters.model}%` });
    }

    // Get total count
    const total = await query.getCount();

    // Apply sorting
    const sortField = sort?.field || 'id';
    const sortOrder = sort?.order || 'ASC';
    query.orderBy(`car.${sortField}`, sortOrder);

    // Apply pagination
    query.skip(pagination.offset).take(pagination.limit);

    const cars = await query.getMany();

    // Return paginated response
    return {
      data: cars,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    };
  }

  /**
   * Get car by ID
   */
  async getCarById(id: number): Promise<Car | null> {
    return await this.carRepository.findById(id);
  }

  /**
   * Get available cars with pagination
   */
  async getAvailableCars(
    pagination?: { page: number; limit: number; offset: number },
    filters?: { [key: string]: any },
    sort?: { field: string; order: 'ASC' | 'DESC' }
  ): Promise<any> {
    if (!pagination) {
      return await this.carRepository.findAvailableCars();
    }

    const query = this.carRepository['repository'].createQueryBuilder('car')
      .where('car.status = :status', { status: 'available' });

    if (filters?.type) {
      query.andWhere('car.type = :type', { type: filters.type });
    }
    if (filters?.brand) {
      query.andWhere('car.brand ILIKE :brand', { brand: `%${filters.brand}%` });
    }

    const total = await query.getCount();

    const sortField = sort?.field || 'id';
    const sortOrder = sort?.order || 'ASC';
    query.orderBy(`car.${sortField}`, sortOrder);

    query.skip(pagination.offset).take(pagination.limit);

    const cars = await query.getMany();

    return {
      data: cars,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    };
  }

  /**
   * Get cars by type with pagination
   */
  async getCarsByType(
    type: CarType,
    pagination?: { page: number; limit: number; offset: number }
  ): Promise<any> {
    if (!pagination) {
      return await this.carRepository.findByType(type);
    }

    const query = this.carRepository['repository'].createQueryBuilder('car')
      .where('car.type = :type', { type });

    const total = await query.getCount();
    query.orderBy('car.id', 'ASC');
    query.skip(pagination.offset).take(pagination.limit);

    const cars = await query.getMany();

    return {
      data: cars,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    };
  }

  /**
   * Create a new car using Factory Pattern
   */
  async createCar(data: CarData, carType: CarType = CarType.ECONOMY): Promise<Car> {
    const factory = CarFactoryProvider.getFactory(carType);
    const car = factory.registerCar(data);
    return await this.carRepository.create(car);
  }

  /**
   * Update car
   */
  async updateCar(id: number, data: Partial<Car>): Promise<Car> {
    return await this.carRepository.update(id, data);
  }

  /**
   * Delete car
   */
  async deleteCar(id: number): Promise<boolean> {
    return await this.carRepository.delete(id);
  }

  /**
   * Update car status
   */
  async updateCarStatus(id: number, status: CarStatus): Promise<Car> {
    return await this.carRepository.updateStatus(id, status);
  }

  /**
   * Check if car is available for rental
   */
  async isCarAvailable(id: number): Promise<boolean> {
    const car = await this.carRepository.findById(id);
    return car !== null && car.status === CarStatus.AVAILABLE;
  }
}

