import { RentalRepository } from '../repositories/RentalRepository';
import { PenaltyRepository } from '../repositories/PenaltyRepository';
import { CarRepository } from '../repositories/CarRepository';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { Penalty } from '../models/Penalty.entity';
import { RentalBuilder } from '../patterns/builder/RentalBuilder';
import { PricingStrategy, CombinedPricingStrategy, BasePricingStrategy, YearBasedPricingStrategy, DurationBasedPricingStrategy } from '../patterns/strategy/PricingStrategy';
import { RentalSubject, CarStatusObserver, NotificationObserver, LoggingObserver } from '../patterns/observer/Observer';
import { CarStatus } from '../models/Car.entity';

/**
 * Service for rental management
 * Contains business logic for rental operations
 */
export class RentalService {
  private rentalRepository: RentalRepository;
  private penaltyRepository: PenaltyRepository;
  private carRepository: CarRepository;

  constructor() {
    this.rentalRepository = new RentalRepository();
    this.penaltyRepository = new PenaltyRepository();
    this.carRepository = new CarRepository();
  }

  /**
   * Create a new rental using Builder Pattern
   */
  async createRental(
    clientId: number,
    carId: number,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    // Validate dates
    if (startDate >= expectedEndDate) {
      throw new Error('Start date must be before expected end date');
    }

    if (startDate < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    // Get car and check availability
    const car = await this.carRepository.findById(carId);
    if (!car) {
      throw new Error('Car not found');
    }

    if (car.status !== CarStatus.AVAILABLE) {
      throw new Error('Car is not available for rental');
    }

    // Get client
    const { ClientRepository } = await import('../repositories/ClientRepository');
    const clientRepository = new ClientRepository();
    const client = await clientRepository.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Create pricing strategy
    const pricingStrategy = this.createPricingStrategy();

    // Build rental using Builder Pattern
    const rentalBuilder = new RentalBuilder()
      .setClient(client)
      .setCar(car)
      .setDates(startDate, expectedEndDate)
      .calculateCost(pricingStrategy)
      .setStatus(RentalStatus.ACTIVE);

    const rental = rentalBuilder.build();

    // Save rental
    const savedRental = await this.rentalRepository.create(rental);

    // Update car status
    await this.carRepository.updateStatus(carId, CarStatus.RENTED);

    // Setup Observer Pattern for notifications
    const rentalSubject = new RentalSubject(savedRental);
    rentalSubject.attach(new CarStatusObserver());
    rentalSubject.attach(new NotificationObserver());
    rentalSubject.attach(new LoggingObserver());
    rentalSubject.notify('rental_created', { rental: savedRental });

    return savedRental;
  }

  /**
   * Complete a rental
   */
  async completeRental(rentalId: number, actualEndDate?: Date): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new Error('Rental is not active');
    }

    // Update rental
    const updateData: Partial<Rental> = {
      status: RentalStatus.COMPLETED,
      actualEndDate: actualEndDate || new Date(),
    };

    // Calculate penalty if returned late
    if (actualEndDate && actualEndDate > rental.expectedEndDate) {
      const daysLate = Math.ceil(
        (actualEndDate.getTime() - rental.expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const lateFee = rental.car.pricePerDay * daysLate * 0.5; // 50% of daily rate per day
      updateData.penaltyAmount = lateFee;
    }

    const updatedRental = await this.rentalRepository.update(rentalId, updateData);

    // Update car status
    await this.carRepository.updateStatus(rental.car.id, CarStatus.AVAILABLE);

    // Notify observers
    const rentalSubject = new RentalSubject(updatedRental);
    rentalSubject.attach(new CarStatusObserver());
    rentalSubject.attach(new NotificationObserver());
    rentalSubject.attach(new LoggingObserver());
    rentalSubject.complete();

    return updatedRental;
  }

  /**
   * Cancel a rental
   */
  async cancelRental(rentalId: number): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new Error('Only active rentals can be cancelled');
    }

    // Update rental
    const updatedRental = await this.rentalRepository.update(rentalId, {
      status: RentalStatus.CANCELLED,
    });

    // Update car status
    await this.carRepository.updateStatus(rental.car.id, CarStatus.AVAILABLE);

    // Notify observers
    const rentalSubject = new RentalSubject(updatedRental);
    rentalSubject.attach(new CarStatusObserver());
    rentalSubject.attach(new NotificationObserver());
    rentalSubject.attach(new LoggingObserver());
    rentalSubject.cancel();

    return updatedRental;
  }

  /**
   * Get all rentals
   */
  async getAllRentals(): Promise<Rental[]> {
    return await this.rentalRepository.findAll();
  }

  /**
   * Get rental by ID
   */
  async getRentalById(id: number): Promise<Rental | null> {
    return await this.rentalRepository.findById(id);
  }

  /**
   * Get active rentals
   */
  async getActiveRentals(): Promise<Rental[]> {
    return await this.rentalRepository.findActiveRentals();
  }

  /**
   * Get rentals by client ID
   */
  async getRentalsByClientId(clientId: number): Promise<Rental[]> {
    return await this.rentalRepository.findByClientId(clientId);
  }

  /**
   * Get rentals by car ID
   */
  async getRentalsByCarId(carId: number): Promise<Rental[]> {
    return await this.rentalRepository.findByCarId(carId);
  }

  /**
   * Add penalty to rental
   */
  async addPenalty(rentalId: number, amount: number, reason: string): Promise<Penalty> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    const penalty = await this.penaltyRepository.create({
      rental,
      amount,
      reason,
      date: new Date(),
    } as Partial<Penalty>);

    // Update rental penalty amount
    const totalPenalties = await this.penaltyRepository.getTotalByRentalId(rentalId);
    await this.rentalRepository.update(rentalId, {
      penaltyAmount: totalPenalties,
    } as Partial<Rental>);

    return penalty;
  }

  /**
   * Create pricing strategy
   */
  private createPricingStrategy(): PricingStrategy {
    return new CombinedPricingStrategy([
      new BasePricingStrategy(),
      new YearBasedPricingStrategy(),
      new DurationBasedPricingStrategy(),
    ]);
  }
}

