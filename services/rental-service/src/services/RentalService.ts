import { Rental } from '../entities/Rental.entity';
import { RentalStatus } from '../entities/Rental.entity';
import { RentalRepository } from '../repositories/RentalRepository';
import { CarServiceClient } from './CarServiceClient';
import { UserServiceClient } from './UserServiceClient';
import { sendEvent } from '../kafka/producer';
import logger from '../utils/logger';

export class RentalService {
  private rentalRepository: RentalRepository;
  private carServiceClient: CarServiceClient;
  private userServiceClient: UserServiceClient;

  constructor() {
    this.rentalRepository = new RentalRepository();
    this.carServiceClient = new CarServiceClient();
    this.userServiceClient = new UserServiceClient();
  }

  private normalizeDateToStartOfDay(d: Date): Date {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private doOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  async createRental(
    carId: string,
    renterUserId: string,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    const start = new Date(startDate);
    const end = new Date(expectedEndDate);

    if (start >= end) {
      throw new Error('Start date must be before expected end date');
    }

    const now = new Date();
    if (this.normalizeDateToStartOfDay(start) < this.normalizeDateToStartOfDay(now)) {
      throw new Error('Start date cannot be in the past');
    }

    const carForRental = await this.carServiceClient.getCarForRental(carId);
    if (!carForRental) {
      const error: any = new Error(
        'Car not found or not available for rental (maintenance/deleted or invalid pricing)'
      );
      error.statusCode = 400;
      throw error;
    }

    const userExists = await this.userServiceClient.validateRenter(renterUserId);
    if (!userExists) {
      const error: any = new Error('Renter user not found');
      error.statusCode = 400;
      throw error;
    }

    const existingRentals = await this.rentalRepository.findByCarId(carId);
    const hasOverlap = existingRentals.some((r) => {
      if (r.status === RentalStatus.COMPLETED || r.status === RentalStatus.CANCELLED) {
        const rentalEnd = new Date(r.actualEndDate || r.expectedEndDate);
        if (rentalEnd < now) return false;
      } else if (r.status !== RentalStatus.ACTIVE) return false;

      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.actualEndDate || r.expectedEndDate);
      return this.doOverlap(start, end, rStart, rEnd);
    });

    if (hasOverlap) {
      const error: any = new Error('Car is already booked for the selected dates');
      error.statusCode = 400;
      throw error;
    }

    const days = this.daysBetween(start, end);
    const totalCost = Number((carForRental.dailyRate * days).toFixed(2));
    const depositAmount = carForRental.depositAmount;

    const rental = await this.rentalRepository.create({
      carId,
      renterUserId,
      startDate: start,
      expectedEndDate: end,
      depositAmount,
      totalCost,
      penaltyAmount: 0,
      status: RentalStatus.ACTIVE,
    });

    await this.carServiceClient.updateCarStatus(carId, 'rented');
    await sendEvent('rental.created', {
      rentalId: rental.id,
      carId,
      renterId: renterUserId,
      ownerId: carForRental.car.ownerId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalCost,
      status: 'active',
    });

    logger.info('Rental created', { rentalId: rental.id, carId, renterUserId });
    return rental;
  }

  async completeRental(rentalId: string, actualEndDate?: Date): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.status !== RentalStatus.ACTIVE) throw new Error('Rental is not active');

    const endDate = actualEndDate || new Date();
    const startOnly = this.normalizeDateToStartOfDay(rental.startDate);
    const endOnly = this.normalizeDateToStartOfDay(endDate);
    if (endOnly < startOnly) throw new Error('Actual end date cannot be before start date');

    const carForRental = await this.carServiceClient.getCarForRental(rental.carId);
    const dailyRate = carForRental?.dailyRate ?? 0;

    const actualDays = this.daysBetween(rental.startDate, endDate);
    let actualTotalCost = Number((dailyRate * actualDays).toFixed(2));
    let penaltyAmount = 0;

    if (endDate > rental.expectedEndDate) {
      const daysLate = this.daysBetween(rental.expectedEndDate, endDate);
      penaltyAmount = Number((dailyRate * daysLate * 0.5).toFixed(2));
    }

    await this.rentalRepository.update(rentalId, {
      status: RentalStatus.COMPLETED,
      actualEndDate: endDate,
      totalCost: actualTotalCost,
      penaltyAmount,
    });

    const otherActive = (await this.rentalRepository.findByCarId(rental.carId)).filter(
      (r) => r.id !== rentalId && r.status === RentalStatus.ACTIVE
    );
    if (otherActive.length === 0) {
      await this.carServiceClient.updateCarStatus(rental.carId, 'active');
    }

    await sendEvent('rental.completed', {
      rentalId,
      carId: rental.carId,
      finalCost: actualTotalCost + penaltyAmount,
      timestamp: new Date().toISOString(),
    });

    return (await this.rentalRepository.findById(rentalId))!;
  }

  async cancelRental(rentalId: string, cancellationDate?: Date): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.status !== RentalStatus.ACTIVE) throw new Error('Only active rentals can be cancelled');

    const cancelDate = cancellationDate || new Date();

    if (cancelDate < rental.startDate) {
      await this.rentalRepository.update(rentalId, {
        status: RentalStatus.CANCELLED,
        actualEndDate: cancelDate,
        totalCost: 0,
        penaltyAmount: 0,
      });
    } else {
      const carForRental = await this.carServiceClient.getCarForRental(rental.carId);
      const dailyRate = carForRental?.dailyRate ?? 0;
      const actualDays = this.daysBetween(rental.startDate, cancelDate);
      const daysToCharge = Math.max(1, actualDays);
      const actualTotalCost = Number((dailyRate * daysToCharge).toFixed(2));
      let penaltyAmount = 0;
      if (cancelDate > rental.expectedEndDate) {
        const daysLate = this.daysBetween(rental.expectedEndDate, cancelDate);
        penaltyAmount = Number((dailyRate * daysLate * 0.5).toFixed(2));
      }
      await this.rentalRepository.update(rentalId, {
        status: RentalStatus.CANCELLED,
        actualEndDate: cancelDate,
        totalCost: actualTotalCost,
        penaltyAmount,
      });
    }

    const otherActive = (await this.rentalRepository.findByCarId(rental.carId)).filter(
      (r) => r.id !== rentalId && r.status === RentalStatus.ACTIVE
    );
    if (otherActive.length === 0) {
      await this.carServiceClient.updateCarStatus(rental.carId, 'active');
    }

    await sendEvent('rental.cancelled', {
      rentalId,
      cancelledBy: rental.renterUserId,
      timestamp: new Date().toISOString(),
    });

    return (await this.rentalRepository.findById(rentalId))!;
  }

  async getRentalById(id: string): Promise<Rental | null> {
    return await this.rentalRepository.findById(id);
  }

  async getAllRentals(): Promise<Rental[]> {
    return await this.rentalRepository.findAll();
  }

  async getActiveRentals(): Promise<Rental[]> {
    return await this.rentalRepository.findActive();
  }

  async getRentalsByCarId(carId: string): Promise<Rental[]> {
    return await this.rentalRepository.findByCarId(carId);
  }

  async getRentalsByRenterId(renterUserId: string): Promise<Rental[]> {
    return await this.rentalRepository.findByRenterId(renterUserId);
  }

  async getRentalsForCurrentRenter(renterUserId: string): Promise<Rental[]> {
    return this.getRentalsByRenterId(renterUserId);
  }

  async getBookedDates(carId: string): Promise<Array<{ startDate: Date; endDate: Date }>> {
    const rentals = await this.rentalRepository.findByCarId(carId);
    const now = new Date();
    return rentals
      .filter((r) => {
        if (r.status === RentalStatus.ACTIVE) return true;
        if (r.status === RentalStatus.COMPLETED || r.status === RentalStatus.CANCELLED) {
          const end = new Date(r.actualEndDate || r.expectedEndDate);
          return end >= now;
        }
        return false;
      })
      .map((r) => ({ startDate: r.startDate, endDate: r.actualEndDate || r.expectedEndDate }));
  }

  async createBookingForCurrentRenter(
    renterUserId: string,
    carId: string,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    return this.createRental(carId, renterUserId, startDate, expectedEndDate);
  }
}
