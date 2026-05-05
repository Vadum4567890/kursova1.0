import { Car } from '../entities/Car.entity';
import { CarPricing } from '../entities/CarPricing.entity';
import { CarImage } from '../entities/CarImage.entity';
import { CarFeature } from '../entities/CarFeature.entity';
import { CarAvailability } from '../entities/CarAvailability.entity';
import { CarDocument } from '../entities/CarDocument.entity';
import { CarRepository } from '../repositories/CarRepository';
import { CarPricingRepository } from '../repositories/CarPricingRepository';
import { CarImageRepository } from '../repositories/CarImageRepository';
import { CarRatingRepository } from '../repositories/CarRatingRepository';
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
import { CarRating } from '../entities/CarRating.entity';

/** DTO-поле, якого немає в сутності Car, але воно приходить з CreateCarDto / оновлення. */
type CarWritePayload = Partial<Car> & { unavailableDates?: string[] };

export class CarService {
  private carRepository: CarRepository;
  private pricingRepository: CarPricingRepository;
  private imageRepository: CarImageRepository;
  private carRatingRepository: CarRatingRepository;
  private userServiceClient: UserServiceClient;

  constructor() {
    this.carRepository = new CarRepository();
    this.pricingRepository = new CarPricingRepository();
    this.imageRepository = new CarImageRepository();
    this.carRatingRepository = new CarRatingRepository();
    this.userServiceClient = new UserServiceClient();
  }

  private buildBlockedAvailability(carId: string, ownerId: string, unavailableDates: string[]): CarAvailability[] {
    const uniqueDates = [...new Set(unavailableDates)].filter(Boolean);
    return uniqueDates.map((date) => {
      const item = new CarAvailability();
      item.carId = carId;
      item.date = new Date(date);
      item.isAvailable = false;
      item.blockedReason = 'owner_unavailable';
      item.blockedBy = ownerId;
      return item;
    });
  }

  async createCar(carData: CarWritePayload, pricingData?: Partial<CarPricing>): Promise<Car> {
    try {
      // Тимчасово створюємо технічного власника, щоб не блокувати створення авто
      const ownerId = carData.ownerId || uuidv4();
      const unavailableDates = Array.isArray(carData.unavailableDates) ? carData.unavailableDates : [];
      const { unavailableDates: _unused, ...carPersistFields } = carData;

      const car = await this.carRepository.create({
        ...carPersistFields,
        ownerId,
      });

      if (unavailableDates.length > 0) {
        await this.carRepository.update(car.id, {
          availability: this.buildBlockedAvailability(car.id, ownerId, unavailableDates),
        });
      }

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
    searchQuery?: string;
    brand?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Car[]; total: number }> {
    try {
      return await this.carRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting all cars', { error });
      throw error;
    }
  }

  async updateCar(carId: string, carData: CarWritePayload): Promise<Car> {
    try {
      const unavailableDates = Array.isArray(carData.unavailableDates) ? carData.unavailableDates : undefined;
      const existing = await this.carRepository.findById(carId);
      if (!existing) {
        throw new Error('Car not found');
      }
      const { unavailableDates: _unused, ...carPersistFields } = carData;
      const normalizedUpdate: Partial<Car> = { ...carPersistFields };
      if (unavailableDates) {
        normalizedUpdate.availability = this.buildBlockedAvailability(
          carId,
          existing.ownerId,
          unavailableDates
        );
      }
      const updated = await this.carRepository.update(carId, normalizedUpdate);

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

  async syncImages(
    carId: string,
    desiredImages: Array<{ imageUrl: string; isPrimary?: boolean; displayOrder?: number }>
  ): Promise<CarImage[]> {
    try {
      const normalized = desiredImages
        .map((image, index) => ({
          imageUrl: String(image.imageUrl || '').trim(),
          isPrimary: Boolean(image.isPrimary),
          displayOrder: image.displayOrder ?? index,
        }))
        .filter((image) => image.imageUrl);

      const uniqueImages = normalized.filter(
        (image, index, arr) => arr.findIndex((item) => item.imageUrl === image.imageUrl) === index
      );

      if (uniqueImages.length > 0 && !uniqueImages.some((image) => image.isPrimary)) {
        uniqueImages[0].isPrimary = true;
      }

      if (uniqueImages.length > 1) {
        let foundPrimary = false;
        uniqueImages.forEach((image) => {
          if (image.isPrimary && !foundPrimary) {
            foundPrimary = true;
            return;
          }
          image.isPrimary = false;
        });
      }

      const existing = await this.imageRepository.findByCarId(carId);
      const desiredUrls = new Set(uniqueImages.map((image) => image.imageUrl));

      for (const image of existing) {
        if (!desiredUrls.has(image.imageUrl)) {
          await this.imageRepository.delete(image.id);
        }
      }

      const byUrl = new Map<string, CarImage[]>();
      const refreshed = await this.imageRepository.findByCarId(carId);
      refreshed.forEach((image) => {
        const current = byUrl.get(image.imageUrl) || [];
        current.push(image);
        byUrl.set(image.imageUrl, current);
      });

      for (const [url, duplicates] of byUrl.entries()) {
        if (duplicates.length <= 1) continue;
        const [keeper, ...extra] = duplicates;
        for (const duplicate of extra) {
          await this.imageRepository.delete(duplicate.id);
        }
        byUrl.set(url, [keeper]);
      }

      for (const image of uniqueImages) {
        const current = byUrl.get(image.imageUrl)?.[0];
        if (current) {
          await this.imageRepository.update(current.id, {
            isPrimary: image.isPrimary,
            displayOrder: image.displayOrder,
          });
          continue;
        }

        const created = await this.imageRepository.create({
          carId,
          imageUrl: image.imageUrl,
          isPrimary: image.isPrimary,
          displayOrder: image.displayOrder,
        });
        byUrl.set(image.imageUrl, [created]);
      }

      const finalImages = await this.imageRepository.findByCarId(carId);
      const primaryImage = finalImages.find((image) => image.isPrimary);
      if (!primaryImage && finalImages.length > 0) {
        await this.imageRepository.setPrimary(carId, finalImages[0].id);
      }

      return this.imageRepository.findByCarId(carId);
    } catch (error) {
      logger.error('Error syncing car images', { carId, error });
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

  async getCarRating(carId: string): Promise<CarRating> {
    return await this.carRatingRepository.getOrCreate(carId);
  }

  async incrementCompletedRentals(carId: string): Promise<CarRating> {
    return await this.carRatingRepository.incrementCompletedRentals(carId);
  }

  async applyPublishedReviewAggregate(
    carId: string,
    payload: {
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<CarRating> {
    return await this.carRatingRepository.applyPublishedReviewAggregate(carId, payload);
  }
}
