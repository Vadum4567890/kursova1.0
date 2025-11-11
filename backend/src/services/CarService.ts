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
   * Get all cars
   */
  async getAllCars(): Promise<Car[]> {
    return await this.carRepository.findAll();
  }

  /**
   * Get car by ID
   */
  async getCarById(id: number): Promise<Car | null> {
    return await this.carRepository.findById(id);
  }

  /**
   * Get available cars
   */
  async getAvailableCars(): Promise<Car[]> {
    return await this.carRepository.findAvailableCars();
  }

  /**
   * Get cars by type
   */
  async getCarsByType(type: CarType): Promise<Car[]> {
    return await this.carRepository.findByType(type);
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

