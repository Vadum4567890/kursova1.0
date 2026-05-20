import { In, Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Rental } from '../entities/Rental.entity';
import { RentalStatus } from '../entities/Rental.entity';

export class RentalRepository {
  private repository: Repository<Rental>;

  constructor() {
    this.repository = AppDataSource.getRepository(Rental);
  }

  async create(data: Partial<Rental>): Promise<Rental> {
    const now = new Date();
    const rental = this.repository.create({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    return await this.repository.save(rental);
  }

  async findById(id: string): Promise<Rental | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findByCarId(carId: string): Promise<Rental[]> {
    return await this.repository.find({
      where: { carId },
      order: { startDate: 'ASC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findByRenterId(renterUserId: string): Promise<Rental[]> {
    return await this.repository.find({
      where: { renterUserId },
      order: { startDate: 'DESC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findByOwnerUserId(ownerUserId: string): Promise<Rental[]> {
    return await this.repository.find({
      where: { ownerUserId },
      order: { createdAt: 'DESC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findByCarIds(carIds: string[]): Promise<Rental[]> {
    if (carIds.length === 0) return [];
    return await this.repository.find({
      where: { carId: In(carIds) },
      order: { startDate: 'DESC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findAll(): Promise<Rental[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  async findActive(): Promise<Rental[]> {
    return await this.repository.find({
      where: { status: In([RentalStatus.ACTIVE, RentalStatus.PENDING]) },
      order: { startDate: 'ASC' },
      relations: ['penalties', 'resolutions'],
    });
  }

  /** Майбутній старт вже настав — переводимо pending → active */
  async promoteDuePendingRentals(now: Date = new Date()): Promise<void> {
    void now;
  }

  async update(id: string, data: Partial<Rental>): Promise<Rental> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Rental not found after update');
    return updated;
  }
}
