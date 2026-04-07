import { Repository } from 'typeorm';
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
      relations: ['penalties'],
    });
  }

  async findByCarId(carId: string): Promise<Rental[]> {
    return await this.repository.find({
      where: { carId },
      order: { startDate: 'ASC' },
      relations: ['penalties'],
    });
  }

  async findByRenterId(renterUserId: string): Promise<Rental[]> {
    return await this.repository.find({
      where: { renterUserId },
      order: { startDate: 'DESC' },
      relations: ['penalties'],
    });
  }

  async findAll(): Promise<Rental[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' },
      relations: ['penalties'],
    });
  }

  async findActive(): Promise<Rental[]> {
    return await this.repository.find({
      where: { status: RentalStatus.ACTIVE },
      order: { startDate: 'ASC' },
      relations: ['penalties'],
    });
  }

  async update(id: string, data: Partial<Rental>): Promise<Rental> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Rental not found after update');
    return updated;
  }
}
