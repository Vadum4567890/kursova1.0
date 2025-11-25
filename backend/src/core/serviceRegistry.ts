import { container } from './Container';
import { CarRepository } from '../repositories/CarRepository';
import { ClientRepository } from '../repositories/ClientRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { PenaltyRepository } from '../repositories/PenaltyRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CarService } from '../services/CarService';
import { ClientService } from '../services/ClientService';
import { RentalService } from '../services/RentalService';
import { PenaltyService } from '../services/PenaltyService';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { AnalyticsService } from '../services/AnalyticsService';
import { ReportService } from '../services/ReportService';
import { SearchService } from '../services/SearchService';

/**
 * Register all services and repositories in the DI container
 * This should be called once during application startup
 */
export function registerServices(): void {
  // Register Repositories
  container.register('ICarRepository', () => new CarRepository(), true);
  container.register('IClientRepository', () => new ClientRepository(), true);
  container.register('IRentalRepository', () => new RentalRepository(), true);
  container.register('IPenaltyRepository', () => new PenaltyRepository(), true);
  container.register('IUserRepository', () => new UserRepository(), true);

  // Register Services (with dependencies)
  container.register('ICarService', () => {
    const carRepository = container.resolve<any>('ICarRepository');
    return new CarService(carRepository);
  }, true);

  container.register('IClientService', () => {
    const clientRepository = container.resolve<any>('IClientRepository');
    return new ClientService(clientRepository);
  }, true);

  container.register('IRentalService', () => {
    const rentalRepository = container.resolve<any>('IRentalRepository');
    const penaltyRepository = container.resolve<any>('IPenaltyRepository');
    const carRepository = container.resolve<any>('ICarRepository');
    const clientRepository = container.resolve<any>('IClientRepository');
    return new RentalService(rentalRepository, penaltyRepository, carRepository, clientRepository);
  }, true);

  container.register('IPenaltyService', () => {
    const penaltyRepository = container.resolve<any>('IPenaltyRepository');
    const rentalRepository = container.resolve<any>('IRentalRepository');
    return new PenaltyService(penaltyRepository, rentalRepository);
  }, true);

  container.register('IAuthService', () => {
    const userRepository = container.resolve<any>('IUserRepository');
    return new AuthService(userRepository);
  }, true);

  container.register('IUserService', () => {
    const userRepository = container.resolve<any>('IUserRepository');
    return new UserService(userRepository);
  }, true);

  container.register('AnalyticsService', () => {
    const carRepository = container.resolve<any>('ICarRepository');
    const clientRepository = container.resolve<any>('IClientRepository');
    const rentalRepository = container.resolve<any>('IRentalRepository');
    const penaltyRepository = container.resolve<any>('IPenaltyRepository');
    return new AnalyticsService(carRepository, clientRepository, rentalRepository, penaltyRepository);
  }, true);

  container.register('ReportService', () => {
    const rentalRepository = container.resolve<any>('IRentalRepository');
    const carRepository = container.resolve<any>('ICarRepository');
    return new ReportService(rentalRepository, carRepository);
  }, true);

  container.register('SearchService', () => {
    const carRepository = container.resolve<any>('ICarRepository');
    const clientRepository = container.resolve<any>('IClientRepository');
    const rentalRepository = container.resolve<any>('IRentalRepository');
    return new SearchService(carRepository, clientRepository, rentalRepository);
  }, true);
}

