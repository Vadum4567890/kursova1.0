import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Car } from '../entities/Car.entity';
import { CarCategory, CarStatus, TransmissionType, FuelType } from '../entities/Car.entity';

export class CarRepository {
  private repository: Repository<Car>;

  constructor() {
    this.repository = AppDataSource.getRepository(Car);
  }

  async create(carData: Partial<Car>): Promise<Car> {
    const car = this.repository.create(carData);
    return await this.repository.save(car);
  }

  async findById(id: string): Promise<Car | null> {
    return await this.repository.findOne({
      where: { id } as FindOptionsWhere<Car>,
      relations: ['pricing', 'features', 'availability', 'images', 'documents'],
    });
  }

  async findByOwnerId(ownerId: string): Promise<Car[]> {
    return await this.repository
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.pricing', 'pricing')
      .leftJoinAndSelect('car.features', 'features')
      .leftJoinAndSelect('car.images', 'images')
      .where('car.ownerId = :ownerId', { ownerId })
      .andWhere('car.status != :deleted', { deleted: CarStatus.DELETED })
      .orderBy('car.createdAt', 'DESC')
      .getMany();
  }

  async findAll(options?: {
    category?: CarCategory;
    status?: CarStatus;
    transmission?: TransmissionType;
    fuelType?: FuelType;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<Car[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.pricing', 'pricing')
      .leftJoinAndSelect('car.features', 'features')
      .leftJoinAndSelect('car.images', 'images')
      .where('car.status != :deleted', { deleted: CarStatus.DELETED });

    if (options?.category) {
      queryBuilder.andWhere('car.category = :category', { category: options.category });
    }

    if (options?.status) {
      queryBuilder.andWhere('car.status = :status', { status: options.status });
    }

    if (options?.transmission) {
      queryBuilder.andWhere('car.transmission = :transmission', { transmission: options.transmission });
    }

    if (options?.fuelType) {
      queryBuilder.andWhere('car.fuelType = :fuelType', { fuelType: options.fuelType });
    }

    if (options?.minPrice) {
      queryBuilder.andWhere('pricing.dailyRate >= :minPrice', { minPrice: options.minPrice });
    }

    if (options?.maxPrice) {
      queryBuilder.andWhere('pricing.dailyRate <= :maxPrice', { maxPrice: options.maxPrice });
    }

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    queryBuilder.orderBy('car.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async update(id: string, carData: Partial<Car>): Promise<Car> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Car not found');
    }
    const merged = this.repository.merge(existing, carData);
    return await this.repository.save(merged);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { status: CarStatus.DELETED });
  }

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Car[]> {
    // Using PostGIS distance calculation (requires PostGIS extension)
    // For now, using simple bounding box approximation
    const latDelta = radiusKm / 111; // ~111 km per degree latitude
    const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    return await this.repository
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.pricing', 'pricing')
      .leftJoinAndSelect('car.features', 'features')
      .leftJoinAndSelect('car.images', 'images')
      .where('car.locationLatitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      })
      .andWhere('car.locationLongitude BETWEEN :minLon AND :maxLon', {
        minLon: longitude - lonDelta,
        maxLon: longitude + lonDelta,
      })
      .andWhere('car.status = :status', { status: CarStatus.ACTIVE })
      .limit(limit)
      .getMany();
  }
}

