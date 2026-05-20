import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { RentalResolution } from '../entities/RentalResolution.entity';

export class RentalResolutionRepository {
  private repository: Repository<RentalResolution>;

  constructor() {
    this.repository = AppDataSource.getRepository(RentalResolution);
  }

  async create(data: Partial<RentalResolution>): Promise<RentalResolution> {
    const row = this.repository.create(data);
    return this.repository.save(row);
  }

  async findByRentalId(rentalId: string): Promise<RentalResolution[]> {
    return this.repository.find({
      where: { rentalId },
      order: { createdAt: 'DESC' },
    });
  }
}
