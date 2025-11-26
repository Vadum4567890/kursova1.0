import { IRentalRepository } from '../core/interfaces/IRentalRepository';
import { IPenaltyRepository } from '../core/interfaces/IPenaltyRepository';
import { ICarRepository } from '../core/interfaces/ICarRepository';
import { IClientRepository } from '../core/interfaces/IClientRepository';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { Penalty } from '../models/Penalty.entity';
import { RentalBuilder } from '../patterns/builder/RentalBuilder';
import { PricingStrategy, CombinedPricingStrategy, BasePricingStrategy, YearBasedPricingStrategy, DurationBasedPricingStrategy } from '../patterns/strategy/PricingStrategy';
import { RentalSubject, CarStatusObserver, NotificationObserver, LoggingObserver } from '../patterns/observer/Observer';
import { CarStatus } from '../models/Car.entity';
import { IRentalService } from '../core/interfaces/IRentalService';

/**
 * Service for rental management
 * Contains business logic for rental operations
 * Implements IRentalService interface
 */
export class RentalService implements IRentalService {
  constructor(
    private rentalRepository: IRentalRepository,
    private penaltyRepository: IPenaltyRepository,
    private carRepository: ICarRepository,
    private clientRepository: IClientRepository
  ) {}

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

    // Check if car is in maintenance (only maintenance cars cannot be rented)
    if (car.status === CarStatus.MAINTENANCE) {
      throw new Error('Car is in maintenance and cannot be rented');
    }
    
    // Check if the requested dates overlap with existing active or future rentals
    const existingRentals = await this.rentalRepository.findByCarId(carId);
    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(expectedEndDate);
    const now = new Date();
    
    const hasOverlap = existingRentals.some((rental: any) => {
      // Only check active rentals or future rentals (not completed/cancelled in the past)
      if (rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.CANCELLED) {
        const rentalEnd = new Date(rental.actualEndDate || rental.expectedEndDate);
        // Skip if rental ended in the past
        if (rentalEnd < now) return false;
      } else if (rental.status !== RentalStatus.ACTIVE) {
        return false;
      }
      
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.actualEndDate || rental.expectedEndDate);
      
      // Check if date ranges overlap
      return (requestedStart <= rentalEnd && requestedEnd >= rentalStart);
    });
    
    if (hasOverlap) {
      throw new Error('Car is already booked for the selected dates. Please choose different dates.');
    }

    // Get client
    const client = await this.clientRepository.findById(clientId);
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
   * Handles different scenarios:
   * 1. Early return (before expected end) - charge for actual days, refund remaining deposit
   * 2. On-time return - charge full expected cost, refund full deposit
   * 3. Late return - charge for actual days + penalty, deposit minus penalty (if penalty > deposit, deposit = 0)
   */
  async completeRental(rentalId: number, actualEndDate?: Date): Promise<Rental> {
    const rental = await this.getRentalById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new Error('Rental is not active');
    }

    let endDate = actualEndDate || new Date();
    
    // Normalize dates to start of day for comparison (compare only dates, not time)
    const startDateOnly = new Date(rental.startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(endDate);
    endDateOnly.setHours(0, 0, 0, 0);
    
    // Ensure end date is not before start date (compare dates only)
    if (endDateOnly < startDateOnly) {
      throw new Error('Actual end date cannot be before start date');
    }
    
    // If end date is the same day as start date, set it to end of day to ensure minimum 1 day rental
    if (endDateOnly.getTime() === startDateOnly.getTime()) {
      endDate = new Date(startDateOnly);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Calculate actual rental days (minimum 1 day)
    // Use normalized dates to ensure accurate day calculation
    const actualDays = Math.max(1, Math.ceil(
      (endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)
    ));
    
    // Recalculate total cost based on actual days
    const pricingStrategy = this.createPricingStrategy();
    const actualTotalCost = pricingStrategy.calculatePrice(rental.car, actualDays);
    
    // Recalculate deposit based on actual days if returned early
    // Deposit formula: base deposit + 15% of daily price per additional day (starting from day 2)
    let actualDepositAmount = rental.depositAmount;
    if (endDate < rental.expectedEndDate) {
      // Early return: recalculate deposit based on actual days
      const baseDeposit = parseFloat(rental.car.deposit.toString());
      const additionalPerDay = parseFloat(rental.car.pricePerDay.toString()) * 0.15;
      const additionalDeposit = additionalPerDay * Math.max(0, actualDays - 1);
      actualDepositAmount = baseDeposit + additionalDeposit;
    }
    
    // Calculate penalty if returned late
    let penaltyAmount = 0;
    if (endDate > rental.expectedEndDate) {
      const daysLate = Math.ceil(
        (endDate.getTime() - rental.expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Penalty: 50% of daily rate per day late
      penaltyAmount = rental.car.pricePerDay * daysLate * 0.5;
    }
    
    // Update rental with recalculated cost and deposit
    const updateData: Partial<Rental> = {
      status: RentalStatus.COMPLETED,
      actualEndDate: endDate,
      totalCost: actualTotalCost,
      depositAmount: actualDepositAmount,
      penaltyAmount: penaltyAmount,
    };

    await this.rentalRepository.update(rentalId, updateData);

    // Reload rental with relations for response
    const updatedRental = await this.getRentalById(rentalId);
    if (!updatedRental) {
      throw new Error('Failed to reload rental after completion');
    }

    // Update car status - check if there are other active rentals
    const otherActiveRentals = await this.rentalRepository.findByCarId(rental.car.id);
    const hasOtherActiveRentals = otherActiveRentals.some(
      (r: any) => r.id !== rentalId && r.status === RentalStatus.ACTIVE
    );
    
    // Only set to AVAILABLE if no other active rentals exist
    if (!hasOtherActiveRentals && rental.car.status !== CarStatus.MAINTENANCE) {
      await this.carRepository.updateStatus(rental.car.id, CarStatus.AVAILABLE);
    }

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
   * Handles different scenarios:
   * 1. Cancellation before start date - full deposit refund, no charge
   * 2. Cancellation after start but before expected end - charge for actual days, refund remaining deposit
   * 3. Cancellation after expected end - charge for expected days + late penalty, deposit minus penalty
   */
  async cancelRental(rentalId: number, cancellationDate?: Date | string): Promise<Rental> {
    const rental = await this.getRentalById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new Error('Only active rentals can be cancelled');
    }

    // Convert cancellationDate to Date if it's a string
    const cancelDate = cancellationDate 
      ? (cancellationDate instanceof Date ? cancellationDate : new Date(cancellationDate))
      : new Date();
    
    // Scenario 1: Cancellation before start date
    if (cancelDate < rental.startDate) {
      // Full deposit refund, no charge for rental
      await this.rentalRepository.update(rentalId, {
        status: RentalStatus.CANCELLED,
        actualEndDate: cancelDate,
        totalCost: 0, // No charge
        penaltyAmount: 0, // No penalty, full deposit refund
      });

      // Reload rental with relations
      const updatedRental = await this.getRentalById(rentalId);
      if (!updatedRental) {
        throw new Error('Failed to reload rental after cancellation');
      }

      // Update car status - check if there are other active rentals
      const otherActiveRentals = await this.rentalRepository.findByCarId(rental.car.id);
      const hasOtherActiveRentals = otherActiveRentals.some(
        (r: any) => r.id !== rentalId && r.status === RentalStatus.ACTIVE
      );
      
      // Only set to AVAILABLE if no other active rentals exist
      if (!hasOtherActiveRentals && rental.car.status !== CarStatus.MAINTENANCE) {
        await this.carRepository.updateStatus(rental.car.id, CarStatus.AVAILABLE);
      }

      const rentalSubject = new RentalSubject(updatedRental);
      rentalSubject.attach(new CarStatusObserver());
      rentalSubject.attach(new NotificationObserver());
      rentalSubject.attach(new LoggingObserver());
      rentalSubject.cancel();

      return updatedRental;
    }

    // Scenario 2 & 3: Cancellation after start date
    // Calculate actual days used
    const actualStartDate = rental.startDate < cancelDate ? rental.startDate : cancelDate;
    const actualDays = Math.ceil(
      (cancelDate.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Minimum 1 day charge
    const daysToCharge = Math.max(1, actualDays);
    
    // Recalculate cost based on actual days
    const pricingStrategy = this.createPricingStrategy();
    const actualTotalCost = pricingStrategy.calculatePrice(rental.car, daysToCharge);
    
    // Calculate penalty if cancelled after expected end date
    let penaltyAmount = 0;
    if (cancelDate > rental.expectedEndDate) {
      const daysLate = Math.ceil(
        (cancelDate.getTime() - rental.expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Penalty: 50% of daily rate per day late
      penaltyAmount = rental.car.pricePerDay * daysLate * 0.5;
    }
    
    // Update rental with calculated values
    await this.rentalRepository.update(rentalId, {
      status: RentalStatus.CANCELLED,
      actualEndDate: cancelDate,
      totalCost: actualTotalCost,
      penaltyAmount: penaltyAmount,
    });

    // Reload rental with relations
    const updatedRental = await this.getRentalById(rentalId);
    if (!updatedRental) {
      throw new Error('Failed to reload rental after cancellation');
    }

    // Update car status - check if there are other active rentals
    const otherActiveRentals = await this.rentalRepository.findByCarId(rental.car.id);
    const hasOtherActiveRentals = otherActiveRentals.some(
      (r: any) => r.id !== rentalId && r.status === RentalStatus.ACTIVE
    );
    
    // Only set to AVAILABLE if no other active rentals exist
    if (!hasOtherActiveRentals && rental.car.status !== CarStatus.MAINTENANCE) {
      await this.carRepository.updateStatus(rental.car.id, CarStatus.AVAILABLE);
    }

    // Notify observers
    const rentalSubject = new RentalSubject(updatedRental);
    rentalSubject.attach(new CarStatusObserver());
    rentalSubject.attach(new NotificationObserver());
    rentalSubject.attach(new LoggingObserver());
    rentalSubject.cancel();

    return updatedRental;
  }

  /**
   * Get all rentals with relations
   */
  async getAllRentals(): Promise<Rental[]> {
    return await this.rentalRepository.findAllWithRelations();
  }

  /**
   * Get rental by ID with relations
   */
  async getRentalById(id: number): Promise<Rental | null> {
    return await this.rentalRepository.getRepository()
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.client', 'client')
      .leftJoinAndSelect('rental.car', 'car')
      .where('rental.id = :id', { id })
      .getOne();
  }

  /**
   * Get active rentals with relations
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
   * Get booked dates for a car (active and future rentals)
   */
  async getBookedDates(carId: number): Promise<Array<{ startDate: Date; endDate: Date }>> {
    const rentals = await this.rentalRepository.findByCarId(carId);
    const now = new Date();
    
    // Get only active rentals or future rentals (not completed/cancelled in the past)
    const bookedPeriods = rentals
      .filter((rental: any) => {
        if (rental.status === RentalStatus.ACTIVE) {
          return true; // Always include active rentals
        }
        
        // For completed/cancelled rentals, only include if they end in the future
        if (rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.CANCELLED) {
          const endDate = new Date(rental.actualEndDate || rental.expectedEndDate);
          return endDate >= now;
        }
        
        return false;
      })
      .map((rental: any) => ({
        startDate: rental.startDate,
        endDate: rental.actualEndDate || rental.expectedEndDate,
      }));
    
    return bookedPeriods;
  }

  /**
   * Get or create client for user
   * For USER role, creates a client record based on user info
   */
  async getOrCreateClientForUser(userId: number, userEmail: string, userFullName?: string): Promise<any> {
    // Try to find existing client by phone (using email as phone identifier)
    let existingClient = await this.clientRepository.findByPhone(userEmail);
    
    // If not found by phone, try to find by full name if provided
    if (!existingClient && userFullName) {
      const clientsByName = await this.clientRepository.findByFullName(userFullName);
      if (clientsByName && clientsByName.length > 0) {
        // Find client with matching email in phone field or take first one
        existingClient = clientsByName.find(c => c.phone === userEmail) || clientsByName[0];
      }
    }
    
    if (existingClient) {
      return existingClient;
    }
    
    // Create new client for user
    const newClient = await this.clientRepository.create({
      fullName: userFullName || `User ${userId}`,
      address: 'Не вказано',
      phone: userEmail,
      registrationDate: new Date(),
    } as any);
    
    return newClient;
  }

  /**
   * Find all possible clients for a user
   * This helps when admin created rentals with different client records
   */
  async findAllClientsForUser(userId: number, userEmail: string, userFullName?: string): Promise<any[]> {
    const possibleClients: any[] = [];
    
    // Find by phone (email)
    const clientByPhone = await this.clientRepository.findByPhone(userEmail);
    if (clientByPhone) {
      possibleClients.push(clientByPhone);
    }
    
    // Find by full name if provided
    if (userFullName) {
      const clientsByName = await this.clientRepository.findByFullName(userFullName);
      if (clientsByName && clientsByName.length > 0) {
        // Add clients that are not already in the list
        clientsByName.forEach(client => {
          if (!possibleClients.find(c => c.id === client.id)) {
            possibleClients.push(client);
          }
        });
      }
    }
    
    return possibleClients;
  }

  /**
   * Get rentals for current user (USER role)
   */
  async getRentalsForUser(userId: number, userEmail: string, userFullName?: string): Promise<Rental[]> {
    // Find all possible clients for this user
    // This handles cases where admin created rentals with different client records
    const possibleClients = await this.findAllClientsForUser(userId, userEmail, userFullName);
    
    // If no clients found, create one
    if (possibleClients.length === 0) {
      const client = await this.getOrCreateClientForUser(userId, userEmail, userFullName);
      if (!client || !client.id) {
        return [];
      }
      const rentals = await this.rentalRepository.findByClientId(client.id);
      return rentals || [];
    }
    
    // Get rentals for all possible clients
    const allRentals: Rental[] = [];
    for (const client of possibleClients) {
      if (client && client.id) {
        const rentals = await this.rentalRepository.findByClientId(client.id);
        if (rentals && rentals.length > 0) {
          allRentals.push(...rentals);
        }
      }
    }
    
    // Remove duplicates and sort by creation date (newest first)
    const uniqueRentals = allRentals.filter((rental, index, self) =>
      index === self.findIndex(r => r.id === rental.id)
    );
    
    uniqueRentals.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate).getTime();
      const dateB = new Date(b.createdAt || b.startDate).getTime();
      return dateB - dateA;
    });
    
    return uniqueRentals;
  }

  /**
   * Create booking (rental) for user
   */
  async createBookingForUser(
    userId: number,
    userEmail: string,
    userFullName: string | undefined,
    carId: number,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    // Get or create client for user
    const client = await this.getOrCreateClientForUser(userId, userEmail, userFullName);
    
    // Use existing createRental method
    return await this.createRental(client.id, carId, startDate, expectedEndDate);
  }

  /**
   * Add penalty to rental
   */
  async addPenalty(rentalId: number, amount: number, reason: string): Promise<Penalty> {
    const rental = await this.getRentalById(rentalId);
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

