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
      const cars = await this.carRepository.findAll();
      // Parse imageUrls for each car
      cars.forEach(car => {
        if (car.imageUrls && typeof car.imageUrls === 'string') {
          try {
            (car as any).imageUrls = JSON.parse(car.imageUrls);
          } catch {
            (car as any).imageUrls = [];
          }
        }
      });
      return cars;
    }

    // Apply filters and get total count
    const query = this.carRepository.getRepository().createQueryBuilder('car');
    
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

    // Parse imageUrls for each car
    cars.forEach(car => {
      if (car.imageUrls && typeof car.imageUrls === 'string') {
        try {
          (car as any).imageUrls = JSON.parse(car.imageUrls);
        } catch {
          (car as any).imageUrls = [];
        }
      }
    });

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
    const car = await this.carRepository.findById(id);
    if (car && car.imageUrls && typeof car.imageUrls === 'string') {
      try {
        (car as any).imageUrls = JSON.parse(car.imageUrls);
      } catch {
        // If parsing fails, keep as string or set to empty array
        (car as any).imageUrls = [];
      }
    }
    return car;
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
      const cars = await this.carRepository.findAvailableCars();
      // Parse imageUrls for each car
      cars.forEach(car => {
        if (car.imageUrls && typeof car.imageUrls === 'string') {
          try {
            (car as any).imageUrls = JSON.parse(car.imageUrls);
          } catch {
            (car as any).imageUrls = [];
          }
        }
      });
      return cars;
    }

    const query = this.carRepository.getRepository().createQueryBuilder('car')
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

    // Parse imageUrls for each car
    cars.forEach(car => {
      if (car.imageUrls && typeof car.imageUrls === 'string') {
        try {
          (car as any).imageUrls = JSON.parse(car.imageUrls);
        } catch {
          (car as any).imageUrls = [];
        }
      }
    });

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
      const cars = await this.carRepository.findByType(type);
      // Parse imageUrls for each car
      cars.forEach(car => {
        if (car.imageUrls && typeof car.imageUrls === 'string') {
          try {
            (car as any).imageUrls = JSON.parse(car.imageUrls);
          } catch {
            (car as any).imageUrls = [];
          }
        }
      });
      return cars;
    }

    const query = this.carRepository.getRepository().createQueryBuilder('car')
      .where('car.type = :type', { type });

    const total = await query.getCount();
    query.orderBy('car.id', 'ASC');
    query.skip(pagination.offset).take(pagination.limit);

    const cars = await query.getMany();

    // Parse imageUrls for each car
    cars.forEach(car => {
      if (car.imageUrls && typeof car.imageUrls === 'string') {
        try {
          (car as any).imageUrls = JSON.parse(car.imageUrls);
        } catch {
          (car as any).imageUrls = [];
        }
      }
    });

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
    
    // Convert imageUrls array to JSON string if present
    if (car.imageUrls && Array.isArray(car.imageUrls)) {
      (car as any).imageUrls = JSON.stringify(car.imageUrls);
    }
    
    return await this.carRepository.create(car);
  }

  /**
   * Update car
   */
  async updateCar(id: number, data: Partial<Car>): Promise<Car> {
    // Convert imageUrls array to JSON string if present
    const updateData = { ...data };
    if (updateData.imageUrls !== undefined) {
      if (Array.isArray(updateData.imageUrls) && updateData.imageUrls.length > 0) {
        (updateData as any).imageUrls = JSON.stringify(updateData.imageUrls);
      } else if (Array.isArray(updateData.imageUrls) && updateData.imageUrls.length === 0) {
        // Empty array - set to null to clear it
        (updateData as any).imageUrls = null;
      }
    }
    
    const updated = await this.carRepository.update(id, updateData);
    
    // Parse imageUrls back to array for response
    if (updated.imageUrls && typeof updated.imageUrls === 'string') {
      try {
        (updated as any).imageUrls = JSON.parse(updated.imageUrls);
      } catch {
        // If parsing fails, keep as string or set to empty array
        (updated as any).imageUrls = [];
      }
    } else if (!updated.imageUrls) {
      (updated as any).imageUrls = [];
    }
    
    return updated;
  }

  /**
   * Delete car
   * Checks if car has active rentals before deletion
   */
  async deleteCar(id: number): Promise<boolean> {
    // Check if car has active rentals
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new Error('Car not found');
    }

    // Check for active rentals
    const { AppDataSource } = await import('../database/data-source');
    const { Rental } = await import('../models/Rental.entity');
    const rentalRepository = AppDataSource.getRepository(Rental);
    const activeRentals = await rentalRepository
      .createQueryBuilder('rental')
      .where('rental.car_id = :carId', { carId: id })
      .andWhere('rental.status = :status', { status: 'active' })
      .getCount();

    if (activeRentals > 0) {
      throw new Error(`Cannot delete car: it has ${activeRentals} active rental(s). Please complete or cancel the rentals first.`);
    }

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

