import { Client } from '../../models/Client.entity';

/**
 * Interface for Client Repository
 */
export interface IClientRepository {
  findAll(): Promise<Client[]>;
  findById(id: number): Promise<Client | null>;
  create(entity: Partial<Client>): Promise<Client>;
  update(id: number, entity: Partial<Client>): Promise<Client>;
  delete(id: number): Promise<boolean>;
  findByPhone(phone: string): Promise<Client | null>;
  findByFullName(fullName: string): Promise<Client[]>;
}

