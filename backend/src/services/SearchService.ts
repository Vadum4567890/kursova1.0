import { CarRepository } from '../repositories/CarRepository';
import { ClientRepository } from '../repositories/ClientRepository';
import { RentalRepository } from '../repositories/RentalRepository';

/**
 * Service for advanced search functionality
 */
export class SearchService {
  private carRepository: CarRepository;
  private clientRepository: ClientRepository;
  private rentalRepository: RentalRepository;

  constructor() {
    this.carRepository = new CarRepository();
    this.clientRepository = new ClientRepository();
    this.rentalRepository = new RentalRepository();
  }

  /**
   * Search cars by multiple criteria
   */
  async searchCars(criteria: {
    brand?: string;
    model?: string;
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
  }): Promise<any[]> {
    const query = this.carRepository.getRepository().createQueryBuilder('car');

    if (criteria.brand) {
      query.andWhere('car.brand ILIKE :brand', { brand: `%${criteria.brand}%` });
    }
    if (criteria.model) {
      query.andWhere('car.model ILIKE :model', { model: `%${criteria.model}%` });
    }
    if (criteria.type) {
      query.andWhere('car.type = :type', { type: criteria.type });
    }
    if (criteria.status) {
      query.andWhere('car.status = :status', { status: criteria.status });
    }
    if (criteria.minPrice !== undefined) {
      query.andWhere('car.pricePerDay >= :minPrice', { minPrice: criteria.minPrice });
    }
    if (criteria.maxPrice !== undefined) {
      query.andWhere('car.pricePerDay <= :maxPrice', { maxPrice: criteria.maxPrice });
    }
    if (criteria.minYear !== undefined) {
      query.andWhere('car.year >= :minYear', { minYear: criteria.minYear });
    }
    if (criteria.maxYear !== undefined) {
      query.andWhere('car.year <= :maxYear', { maxYear: criteria.maxYear });
    }

    return await query.getMany();
  }

  /**
   * Search clients by name or phone
   */
  async searchClients(query: string): Promise<any[]> {
    const clients = await this.clientRepository.findAll();
    
    const searchTerm = query.toLowerCase();
    return clients.filter(client => 
      client.fullName.toLowerCase().includes(searchTerm) ||
      client.phone.includes(searchTerm) ||
      client.address.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Search rentals by multiple criteria
   */
  async searchRentals(criteria: {
    clientId?: number;
    carId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    const query = this.rentalRepository.getRepository()
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.client', 'client')
      .leftJoinAndSelect('rental.car', 'car');

    if (criteria.clientId) {
      query.andWhere('rental.client_id = :clientId', { clientId: criteria.clientId });
    }
    if (criteria.carId) {
      query.andWhere('rental.car_id = :carId', { carId: criteria.carId });
    }
    if (criteria.status) {
      query.andWhere('rental.status = :status', { status: criteria.status });
    }
    if (criteria.startDate) {
      query.andWhere('rental.startDate >= :startDate', { startDate: criteria.startDate });
    }
    if (criteria.endDate) {
      query.andWhere('rental.startDate <= :endDate', { endDate: criteria.endDate });
    }

    return await query.getMany();
  }
}

