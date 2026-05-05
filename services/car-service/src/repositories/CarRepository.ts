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
    searchQuery?: string;
    brand?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Car[]; total: number }> {
    const baseQuery = this.repository
      .createQueryBuilder('car')
      .leftJoin('car.pricing', 'pricing')
      .where('car.status != :deleted', { deleted: CarStatus.DELETED });

    if (options?.category) {
      baseQuery.andWhere('car.category = :category', { category: options.category });
    }

    if (options?.status) {
      baseQuery.andWhere('car.status = :status', { status: options.status });
    }

    if (options?.transmission) {
      baseQuery.andWhere('car.transmission = :transmission', { transmission: options.transmission });
    }

    if (options?.fuelType) {
      baseQuery.andWhere('car.fuelType = :fuelType', { fuelType: options.fuelType });
    }

    const search = options?.searchQuery?.trim();
    if (search) {
      baseQuery.andWhere('(LOWER(car.make) LIKE LOWER(:search) OR LOWER(car.model) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    const brand = options?.brand?.trim();
    if (brand) {
      baseQuery.andWhere('LOWER(car.make) LIKE LOWER(:brand)', {
        brand: `%${brand}%`,
      });
    }

    const model = options?.model?.trim();
    if (model) {
      baseQuery.andWhere('LOWER(car.model) LIKE LOWER(:model)', {
        model: `%${model}%`,
      });
    }

    if (options?.minPrice) {
      baseQuery.andWhere('pricing.dailyRate >= :minPrice', { minPrice: options.minPrice });
    }

    if (options?.maxPrice) {
      baseQuery.andWhere('pricing.dailyRate <= :maxPrice', { maxPrice: options.maxPrice });
    }

    const totalResult = await baseQuery
      .clone()
      .select('COUNT(DISTINCT car.id)', 'total')
      .getRawOne<{ total: string }>();
    const total = Number(totalResult?.total ?? 0);

    const idQuery = baseQuery
      .clone()
      .select(['car.id AS id', 'car.created_at AS "createdAt"'])
      .distinct(true)
      .orderBy('car.created_at', 'DESC');

    if (options?.limit != null) {
      idQuery.limit(options.limit);
    }

    if (options?.offset != null) {
      idQuery.offset(options.offset);
    }

    const rows = await idQuery.getRawMany<{ id: string; createdAt: string }>();
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return { items: [], total };
    }

    const items = await this.repository
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.pricing', 'pricing')
      .leftJoinAndSelect('car.features', 'features')
      .leftJoinAndSelect('car.images', 'images')
      .where('car.id IN (:...ids)', { ids })
      .orderBy('car.createdAt', 'DESC')
      .getMany();

    const orderMap = new Map(ids.map((id, index) => [id, index]));
    items.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    return { items, total };
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
