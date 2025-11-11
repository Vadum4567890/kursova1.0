import { BaseRepository } from './BaseRepository';
import { Client } from '../models/Client.entity';

/**
 * Repository for working with clients
 */
export class ClientRepository extends BaseRepository<Client> {
  constructor() {
    super(Client);
  }

  /**
   * Find client by phone number
   */
  async findByPhone(phone: string): Promise<Client | null> {
    return await this.repository.findOne({
      where: { phone } as any,
    });
  }

  /**
   * Find client by full name
   */
  async findByFullName(fullName: string): Promise<Client[]> {
    return await this.repository.find({
      where: { fullName } as any,
    });
  }
}

