import { Client } from '../../models/Client.entity';

/**
 * Interface for Client Service
 */
export interface IClientService {
  getAllClients(): Promise<Client[]>;
  getClientById(id: number): Promise<Client | null>;
  createClient(data: Partial<Client>): Promise<Client>;
  updateClient(id: number, data: Partial<Client>): Promise<Client>;
  deleteClient(id: number): Promise<boolean>;
  getClientByPhone(phone: string): Promise<Client | null>;
  findByPhone(phone: string): Promise<Client | null>;
  registerOrGetClient(data: Partial<Client>): Promise<Client>;
}

