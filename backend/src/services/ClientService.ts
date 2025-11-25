import { IClientRepository } from '../core/interfaces/IClientRepository';
import { Client } from '../models/Client.entity';
import { IClientService } from '../core/interfaces/IClientService';

/**
 * Service for client management
 * Contains business logic for client operations
 * Implements IClientService interface
 */
export class ClientService implements IClientService {
  constructor(private clientRepository: IClientRepository) {}

  /**
   * Get all clients
   */
  async getAllClients(): Promise<Client[]> {
    return await this.clientRepository.findAll();
  }

  /**
   * Get client by ID
   */
  async getClientById(id: number): Promise<Client | null> {
    return await this.clientRepository.findById(id);
  }

  /**
   * Get client by phone
   */
  async getClientByPhone(phone: string): Promise<Client | null> {
    return await this.clientRepository.findByPhone(phone);
  }

  /**
   * Find client by phone (alias for getClientByPhone)
   */
  async findByPhone(phone: string): Promise<Client | null> {
    return await this.getClientByPhone(phone);
  }

  /**
   * Create a new client
   */
  async createClient(data: Partial<Client>): Promise<Client> {
    // Check if client with this phone already exists
    if (data.phone) {
      const existingClient = await this.clientRepository.findByPhone(data.phone);
      if (existingClient) {
        throw new Error('Client with this phone number already exists');
      }
    }

    const clientData: Partial<Client> = {
      ...data,
      registrationDate: new Date(),
    };

    return await this.clientRepository.create(clientData);
  }

  /**
   * Update client
   */
  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    // Check if phone is being updated and if it's already taken
    if (data.phone) {
      const existingClient = await this.clientRepository.findByPhone(data.phone);
      if (existingClient && existingClient.id !== id) {
        throw new Error('Phone number is already registered to another client');
      }
    }

    return await this.clientRepository.update(id, data);
  }

  /**
   * Delete client
   */
  async deleteClient(id: number): Promise<boolean> {
    return await this.clientRepository.delete(id);
  }

  /**
   * Register or get existing client by phone
   */
  async registerOrGetClient(data: Partial<Client>): Promise<Client> {
    if (data.phone) {
      const existingClient = await this.clientRepository.findByPhone(data.phone);
      if (existingClient) {
        return existingClient;
      }
    }

    return await this.createClient(data);
  }
}

