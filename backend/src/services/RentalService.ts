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
import { Logger } from '../utils/Logger';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { ExportService, ParsedRentalData, ImportResult } from './ExportService';

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
   * Helper function to normalize date to start of day (00:00:00.000)
   * This ensures consistent date comparisons regardless of time
   */
  private normalizeDateToStartOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Helper function to check if two date ranges overlap
   * Dates are normalized to start of day for accurate comparison
   */
  private doDateRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    const normStart1 = this.normalizeDateToStartOfDay(start1);
    const normEnd1 = this.normalizeDateToStartOfDay(end1);
    const normStart2 = this.normalizeDateToStartOfDay(start2);
    const normEnd2 = this.normalizeDateToStartOfDay(end2);
    
    // Ranges overlap if: start1 <= end2 && end1 >= start2
    return normStart1 <= normEnd2 && normEnd1 >= normStart2;
  }

  /**
   * Helper function to check if a rental is in the future or active
   * A rental is considered "relevant" if it overlaps with the requested period
   */
  private isRentalRelevantForOverlapCheck(
    rental: any,
    requestedStart: Date,
    requestedEnd: Date,
    now: Date
  ): boolean {
    // For ACTIVE rentals, always check (they might be current or future)
    if (rental.status === RentalStatus.ACTIVE) {
      return true;
    }

    // For COMPLETED or CANCELLED rentals, check if they ended in the future
    if (rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.CANCELLED) {
      const rentalEnd = new Date(rental.actualEndDate || rental.expectedEndDate);
      // Only check if rental ended in the future (or today)
      return rentalEnd >= now;
    }

    return false;
  }

  /**
   * Helper function to check if car has any active or future rentals
   * Used for determining if car should be AVAILABLE or RENTED
   */
  private async hasActiveOrFutureRentals(carId: number, excludeRentalId?: number): Promise<boolean> {
    const rentals = await this.rentalRepository.findByCarId(carId);
    const now = new Date();
    
    return rentals.some((rental: any) => {
      // Skip the rental we're excluding (e.g., the one being completed/cancelled)
      if (excludeRentalId && rental.id === excludeRentalId) {
        return false;
      }

      // ACTIVE rentals are always relevant
      if (rental.status === RentalStatus.ACTIVE) {
        return true;
      }

      // For COMPLETED/CANCELLED, check if they end in the future
      if (rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.CANCELLED) {
        const rentalEnd = new Date(rental.actualEndDate || rental.expectedEndDate);
        return rentalEnd >= now;
      }

      return false;
    });
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
    // Normalize dates to start of day for validation
    const normalizedStartDate = this.normalizeDateToStartOfDay(new Date(startDate));
    const normalizedEndDate = this.normalizeDateToStartOfDay(new Date(expectedEndDate));
    const normalizedNow = this.normalizeDateToStartOfDay(new Date());

    // Validate dates
    if (normalizedStartDate >= normalizedEndDate) {
      throw new Error('Start date must be before expected end date');
    }

    // Check if start date is in the past (compare normalized dates)
    if (normalizedStartDate < normalizedNow) {
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
    
    // Auto-complete expired rentals before checking for date overlaps
    // This ensures we don't block new rentals due to expired ones
    await this.completeExpiredRentals();
    
    // Check if the requested dates overlap with existing active or future rentals
    const existingRentals = await this.rentalRepository.findByCarId(carId);
    const now = new Date();
    
    const hasOverlap = existingRentals.some((rental: any) => {
      // Check if this rental is relevant for overlap checking
      if (!this.isRentalRelevantForOverlapCheck(rental, normalizedStartDate, normalizedEndDate, now)) {
        return false;
      }
      
      // Get rental date range
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.actualEndDate || rental.expectedEndDate);
      
      // Check if date ranges overlap (using normalized comparison)
      return this.doDateRangesOverlap(
        normalizedStartDate,
        normalizedEndDate,
        rentalStart,
        rentalEnd
      );
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

    // Use transaction to prevent race conditions
    // This ensures that the overlap check and rental creation are atomic
    const dataSource = DatabaseConnection.getInstance().getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Re-check for overlaps within transaction (double-check pattern)
      // This prevents race conditions where two requests pass the initial check
      const existingRentalsInTx = await queryRunner.manager
        .createQueryBuilder(Rental, 'rental')
        .where('rental.car_id = :carId', { carId })
        .getMany();

      const hasOverlapInTx = existingRentalsInTx.some((existingRental: any) => {
        if (!this.isRentalRelevantForOverlapCheck(existingRental, normalizedStartDate, normalizedEndDate, now)) {
          return false;
        }
        
        const rentalStart = new Date(existingRental.startDate);
        const rentalEnd = new Date(existingRental.actualEndDate || existingRental.expectedEndDate);
        
        return this.doDateRangesOverlap(
          normalizedStartDate,
          normalizedEndDate,
          rentalStart,
          rentalEnd
        );
      });

      if (hasOverlapInTx) {
        await queryRunner.rollbackTransaction();
        throw new Error('Car is already booked for the selected dates. Please choose different dates.');
      }

      // Save rental within transaction
      const savedRental = await queryRunner.manager.save(Rental, rental);

      // Update car status within transaction
      await queryRunner.manager
        .createQueryBuilder()
        .update('cars')
        .set({ status: CarStatus.RENTED })
        .where('id = :carId', { carId })
        .execute();

      // Commit transaction
      await queryRunner.commitTransaction();

      // Reload rental with relations for response
      const rentalWithRelations = await this.getRentalById(savedRental.id);
      if (!rentalWithRelations) {
        throw new Error('Failed to reload rental after creation');
      }

      // Setup Observer Pattern for notifications (after transaction)
      const rentalSubject = new RentalSubject(rentalWithRelations);
      rentalSubject.attach(new CarStatusObserver());
      rentalSubject.attach(new NotificationObserver());
      rentalSubject.attach(new LoggingObserver());
      rentalSubject.notify('rental_created', { rental: rentalWithRelations });

      return rentalWithRelations;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
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

    // Update car status - check if there are other active or future rentals
    const hasOtherRentals = await this.hasActiveOrFutureRentals(rental.car.id, rentalId);
    
    // Only set to AVAILABLE if no other active or future rentals exist
    if (!hasOtherRentals && rental.car.status !== CarStatus.MAINTENANCE) {
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

      // Update car status - check if there are other active or future rentals
      const hasOtherRentals = await this.hasActiveOrFutureRentals(rental.car.id, rentalId);
      
      // Only set to AVAILABLE if no other active or future rentals exist
      if (!hasOtherRentals && rental.car.status !== CarStatus.MAINTENANCE) {
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

    // Update car status - check if there are other active or future rentals
    const hasOtherRentals = await this.hasActiveOrFutureRentals(rental.car.id, rentalId);
    
    // Only set to AVAILABLE if no other active or future rentals exist
    if (!hasOtherRentals && rental.car.status !== CarStatus.MAINTENANCE) {
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
   * Automatically completes expired rentals before returning
   */
  async getAllRentals(): Promise<Rental[]> {
    // Auto-complete expired rentals first
    await this.completeExpiredRentals();
    
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
   * Automatically completes expired rentals before returning
   */
  async getActiveRentals(): Promise<Rental[]> {
    // Auto-complete expired rentals first
    await this.completeExpiredRentals();
    
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
   * Automatically completes expired rentals before returning
   */
  async getBookedDates(carId: number): Promise<Array<{ startDate: Date; endDate: Date }>> {
    // Auto-complete expired rentals first
    await this.completeExpiredRentals();
    
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
    // Try to find existing client by email (proper way)
    let existingClient = await this.clientRepository.findByEmail(userEmail);
    
    // If not found by email, try by phone (backward compatibility - some old clients have email in phone)
    if (!existingClient) {
      const clientByPhone = await this.clientRepository.findByPhone(userEmail);
      // Verify that phone actually contains email (has @)
      if (clientByPhone && clientByPhone.phone && clientByPhone.phone.includes('@')) {
        existingClient = clientByPhone;
      }
    }
    
    // If not found by email/phone, try to find by full name if provided
    if (!existingClient && userFullName) {
      const clientsByName = await this.clientRepository.findByFullName(userFullName);
      if (clientsByName && clientsByName.length > 0) {
        // Find client with matching email in email field or phone field
        existingClient = clientsByName.find(
          c => c.email === userEmail || (c.phone && c.phone.includes('@') && c.phone === userEmail)
        ) || clientsByName[0];
      }
    }
    
    if (existingClient) {
      // Update existing client: if email is in phone field, move it to email field
      if (existingClient.phone && existingClient.phone.includes('@') && !existingClient.email) {
        await this.clientRepository.update(existingClient.id, {
          email: existingClient.phone,
          phone: '', // Clear phone if it was actually email
        });
        // Reload client
        existingClient = await this.clientRepository.findById(existingClient.id);
      } else if (!existingClient.email && userEmail) {
        // Update email if missing
        await this.clientRepository.update(existingClient.id, {
          email: userEmail,
        });
        existingClient = await this.clientRepository.findById(existingClient.id);
      }
      return existingClient;
    }
    
    // Create new client for user
    // Store email in email field, NOT in phone field
    const newClient = await this.clientRepository.create({
      fullName: userFullName || `User ${userId}`,
      address: 'Не вказано',
      phone: '', // Don't store email in phone field
      email: userEmail, // Store email in proper email field
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
   * Automatically complete expired rentals
   * Completes all active rentals where expectedEndDate has passed
   * This is called internally by get methods to ensure data consistency
   * Uses current date as actual end date to properly calculate late penalties
   */
  private async completeExpiredRentals(): Promise<number> {
    const now = new Date();
    const activeRentals = await this.rentalRepository.findActiveRentals();
    
    let completedCount = 0;
    
    for (const rental of activeRentals) {
      const expectedEnd = new Date(rental.expectedEndDate);
      
      // If expected end date has passed, complete the rental
      if (expectedEnd < now) {
        try {
          // Complete rental with current date as actual end date
          // This will properly calculate late penalties if the rental is overdue
          await this.completeRental(rental.id, now);
          completedCount++;
          
          const logger = Logger.getInstance();
          const daysOverdue = Math.ceil((now.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60 * 24));
          logger.log(
            `Auto-completed expired rental ID: ${rental.id} (expected: ${expectedEnd.toISOString()}, ${daysOverdue} day(s) overdue)`,
            'info'
          );
        } catch (error) {
          const logger = Logger.getInstance();
          logger.log(
            `Failed to auto-complete rental ID ${rental.id}: ${error}`,
            'error'
          );
        }
      }
    }
    
    return completedCount;
  }

  /**
   * Public method to manually trigger completion of expired rentals
   * Called on server startup to clean up any expired rentals
   */
  async completeExpiredRentalsOnStartup(): Promise<number> {
    return await this.completeExpiredRentals();
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

  /**
   * Import rentals from file (Excel/CSV)
   * Returns result with success count, failed count, and errors
   */
  async importRentalsFromFile(fileBuffer: Buffer, filename: string): Promise<ImportResult> {
    const exportService = new ExportService();
    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      imported: [],
      skippedItems: [],
    };

    let parsedData: ParsedRentalData[] = [];

    try {
      // Parse file
      parsedData = await exportService.importFromFile(fileBuffer, filename);
    } catch (error: any) {
      // File parsing error
      result.failed = 1;
      result.errors.push({
        row: 0,
        data: null,
        error: `Помилка парсингу файлу: ${error.message}`,
      });
      return result;
    }

    // Process each rental
    for (let i = 0; i < parsedData.length; i++) {
      const data = parsedData[i];
      const rowNumber = i + 2; // +2 for header and 0-based index

      try {
        // Find or create client
        let client: any = null;
        
        // First, try to find by email (proper way)
        if (data.clientEmail) {
          client = await this.clientRepository.findByEmail(data.clientEmail);
        }
        
        // If not found by email, try by phone
        if (!client && data.clientPhone) {
          client = await this.clientRepository.findByPhone(data.clientPhone);
          // Verify that phone is not actually an email
          if (client && client.phone && client.phone.includes('@')) {
            // This phone is actually an email, skip it
            client = null;
          }
        }
        
        // If not found, try to find by full name
        if (!client) {
          const clientsByName = await this.clientRepository.findByFullName(data.clientName);
          if (clientsByName && clientsByName.length > 0) {
            // Prefer client with matching email or phone
            client = clientsByName.find(
              c => (data.clientEmail && c.email === data.clientEmail) ||
                   (data.clientPhone && c.phone === data.clientPhone && !c.phone.includes('@'))
            ) || clientsByName[0];
          }
        }

        if (!client) {
          // Create new client
          // Determine phone and email properly
          let phone = '';
          let email = '';
          
          if (data.clientPhone) {
            // If phone contains @, it's actually an email
            if (data.clientPhone.includes('@')) {
              email = data.clientPhone;
              phone = '';
            } else {
              phone = data.clientPhone;
            }
          }
          
          if (data.clientEmail) {
            email = data.clientEmail;
            // If phone was set to email, clear it
            if (phone === data.clientEmail) {
              phone = '';
            }
          }
          
          client = await this.clientRepository.create({
            fullName: data.clientName,
            phone: phone,
            email: email,
            address: 'Не вказано',
            registrationDate: new Date(),
          } as any);
        } else {
          // Update existing client if needed: move email from phone to email field
          if (client.phone && client.phone.includes('@') && !client.email) {
            await this.clientRepository.update(client.id, {
              email: client.phone,
              phone: '',
            });
            client = await this.clientRepository.findById(client.id);
          } else if (!client.email && data.clientEmail) {
            // Update email if missing
            await this.clientRepository.update(client.id, {
              email: data.clientEmail,
            });
            client = await this.clientRepository.findById(client.id);
          }
        }

        // Find car by brand, model, year
        const car = await this.carRepository.findByBrandModelYear(
          data.carBrand,
          data.carModel,
          data.carYear
        );

        if (!car) {
          throw new Error(
            `Автомобіль не знайдено: ${data.carBrand} ${data.carModel} (${data.carYear})`
          );
        }

        // Check if car is available (skip if in maintenance)
        if (car.status === CarStatus.MAINTENANCE) {
          throw new Error('Автомобіль на технічному обслуговуванні');
        }

        // Check for duplicate rental (same client, car, and overlapping dates)
        const normalizedStartDate = this.normalizeDateToStartOfDay(data.startDate);
        const normalizedEndDate = this.normalizeDateToStartOfDay(data.expectedEndDate);
        
        // Get all rentals for this client with car relations loaded
        const existingRentals = await this.rentalRepository.findByClientId(client.id);
        const duplicateRental = existingRentals.find((rental: any) => {
          // Ensure car is loaded (it should be from findByClientId, but check anyway)
          const rentalCarId = rental.car?.id || rental.carId;
          if (!rentalCarId || rentalCarId !== car.id) {
            return false;
          }
          
          // Check if dates overlap
          const rentalStart = this.normalizeDateToStartOfDay(new Date(rental.startDate));
          const rentalEnd = this.normalizeDateToStartOfDay(
            new Date(rental.actualEndDate || rental.expectedEndDate)
          );
          
          return this.doDateRangesOverlap(
            normalizedStartDate,
            normalizedEndDate,
            rentalStart,
            rentalEnd
          );
        });

        if (duplicateRental) {
          // Skip duplicate - don't create it
          result.skipped++;
          result.skippedItems.push({
            row: rowNumber,
            data: data,
            reason: `Дублікат: прокат вже існує для цього клієнта та автомобіля на ці дати (ID: ${duplicateRental.id})`,
          });
          continue;
        }

        // Create rental
        const rental = await this.createRental(
          client.id,
          car.id,
          data.startDate,
          data.expectedEndDate
        );

        // Update status if needed (for completed/cancelled rentals)
        if (data.status && data.status !== RentalStatus.ACTIVE) {
          if (data.status === RentalStatus.COMPLETED) {
            await this.completeRental(rental.id, data.expectedEndDate);
          } else if (data.status === RentalStatus.CANCELLED) {
            await this.cancelRental(rental.id, data.startDate);
          }
        }

        result.success++;
        result.imported.push(rental);
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          data: data,
          error: error.message || 'Невідома помилка',
        });
      }
    }

    return result;
  }
}

