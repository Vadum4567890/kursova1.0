import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { RentalMessage } from '../entities/RentalMessage.entity';

export class RentalMessageRepository {
  private repository: Repository<RentalMessage>;

  constructor() {
    this.repository = AppDataSource.getRepository(RentalMessage);
  }

  async create(data: Partial<RentalMessage>): Promise<RentalMessage> {
    const row = this.repository.create(data);
    return this.repository.save(row);
  }

  async findByRentalId(rentalId: string): Promise<RentalMessage[]> {
    return this.repository.find({
      where: { rentalId },
      order: { createdAt: 'ASC' },
    });
  }

  async countIncomingAfter(rentalId: string, viewerUserId: string, after: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('m')
      .where('m.rentalId = :rentalId', { rentalId })
      .andWhere('LOWER(CAST(m.senderUserId AS text)) != LOWER(:uid)', { uid: viewerUserId })
      .andWhere('m.createdAt > :after', { after })
      .getCount();
  }
}
