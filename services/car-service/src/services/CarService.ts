import { Car } from '../entities/Car.entity';
import { CarPricing } from '../entities/CarPricing.entity';
import { CarImage } from '../entities/CarImage.entity';
import { CarFeature } from '../entities/CarFeature.entity';
import { CarAvailability } from '../entities/CarAvailability.entity';
import { CarDocument } from '../entities/CarDocument.entity';
import { CarRepository } from '../repositories/CarRepository';
import { CarPricingRepository } from '../repositories/CarPricingRepository';
import { CarImageRepository } from '../repositories/CarImageRepository';
import { UserServiceClient } from './UserServiceClient';
import logger from '../utils/logger';
import { sendEvent } from '../kafka/producer';
import { v4 as uuidv4 } from 'uuid';
import {
  CarCategory,
  CarStatus,
  TransmissionType,
  FuelType,
} from '../entities/Car.entity';

export class CarService {
  private carRepository: CarRepository;
  private pricingRepository: CarPricingRepository;
  private imageRepository: CarImageRepository;
  private userServiceClient: UserServiceClient;

  constructor() {
    this.carRepository = new CarRepository();
    this.pricingRepository = new CarPricingRepository();
    this.imageRepository = new CarImageRepository();
    this.userServiceClient = new UserServiceClient();
  }

  async createCar(carData: Partial<Car>, pricingData?: Partial<CarPricing>): Promise<Car> {
    try {
      // Тимчасово створюємо технічного власника, щоб не блокувати створення авто
      const ownerId = carData.ownerId || uuidv4();

      const car = await this.carRepository.create({
        ...carData,
        ownerId,
      });

      if (pricingData) {
        await this.pricingRepository.create({
          ...pricingData,
          carId: car.id,
        });
      }

      // Send Kafka event
      await sendEvent('car.created', {
        carId: car.id,
        ownerId: car.ownerId,
        make: car.make,
        model: car.model,
        category: car.category,
      });

      logger.info('Car created', { carId: car.id });
      const createdCar = await this.getCarById(car.id);
      if (!createdCar) {
        throw new Error('Failed to retrieve created car');
      }
      return createdCar;
    } catch (error) {
      logger.error('Error creating car', { error });
      throw error;
    }
  }

  async getCarById(carId: string): Promise<Car | null> {
    try {
      return await this.carRepository.findById(carId);
    } catch (error) {
      logger.error('Error getting car by ID', { carId, error });
      throw error;
    }
  }

  async getCarsByOwner(ownerId: string): Promise<Car[]> {
    try {
      return await this.carRepository.findByOwnerId(ownerId);
    } catch (error) {
      logger.error('Error getting cars by owner', { ownerId, error });
      throw error;
    }
  }

  async getAllCars(filters?: {
    category?: CarCategory;
    status?: CarStatus;
    transmission?: TransmissionType;
    fuelType?: FuelType;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<Car[]> {
    try {
      return await this.carRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting all cars', { error });
      throw error;
    }
  }

  async updateCar(carId: string, carData: Partial<Car>): Promise<Car> {
    try {
      const updated = await this.carRepository.update(carId, carData);

      // Send Kafka event
      await sendEvent('car.updated', {
        carId: updated.id,
        updatedFields: Object.keys(carData),
      });

      logger.info('Car updated', { carId });
      return updated;
    } catch (error) {
      logger.error('Error updating car', { carId, error });
      throw error;
    }
  }

  async deleteCar(carId: string): Promise<void> {
    try {
      await this.carRepository.delete(carId);

      // Send Kafka event
      await sendEvent('car.deleted', {
        carId,
      });

      logger.info('Car deleted', { carId });
    } catch (error) {
      logger.error('Error deleting car', { carId, error });
      throw error;
    }
  }

  async addImage(carId: string, imageData: Partial<CarImage>): Promise<CarImage> {
    try {
      const image = await this.imageRepository.create({
        ...imageData,
        carId,
      });

      // Send Kafka event
      await sendEvent('car.image.added', {
        carId,
        imageId: image.id,
      });

      logger.info('Image added to car', { carId, imageId: image.id });
      return image;
    } catch (error) {
      logger.error('Error adding image', { carId, error });
      throw error;
    }
  }

  async getCarImages(carId: string): Promise<CarImage[]> {
    try {
      return await this.imageRepository.findByCarId(carId);
    } catch (error) {
      logger.error('Error getting car images', { carId, error });
      throw error;
    }
  }

  async setPrimaryImage(carId: string, imageId: string): Promise<void> {
    try {
      await this.imageRepository.setPrimary(carId, imageId);
      logger.info('Primary image set', { carId, imageId });
    } catch (error) {
      logger.error('Error setting primary image', { carId, imageId, error });
      throw error;
    }
  }

  async updatePricing(carId: string, pricingData: Partial<CarPricing>): Promise<CarPricing> {
    try {
      const existing = await this.pricingRepository.findByCarId(carId);
      
      if (!existing) {
        return await this.pricingRepository.create({
          ...pricingData,
          carId,
        });
      }

      const updated = await this.pricingRepository.update(carId, pricingData);

      // Send Kafka event
      await sendEvent('car.pricing.updated', {
        carId,
        pricing: updated,
      });

      logger.info('Pricing updated', { carId });
      return updated;
    } catch (error) {
      logger.error('Error updating pricing', { carId, error });
      throw error;
    }
  }

  async getCarsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Car[]> {
    try {
      return await this.carRepository.findByLocation(latitude, longitude, radiusKm);
    } catch (error) {
      logger.error('Error getting cars by location', { latitude, longitude, error });
      throw error;
    }
  }
}

