import { Rental, RentalStatus } from '../../models/Rental.entity';
import { Client } from '../../models/Client.entity';
import { Car } from '../../models/Car.entity';
import { PricingStrategy } from '../strategy/PricingStrategy';

/**
 * Builder Pattern for constructing complex rental objects
 * Simplifies the creation process and makes it more readable
 */
export class RentalBuilder {
  private rental: Partial<Rental> = {};

  /**
   * Set the client for the rental
   */
  public setClient(client: Client): this {
    this.rental.client = client;
    return this;
  }

  /**
   * Set the car for the rental
   */
  public setCar(car: Car): this {
    this.rental.car = car;
    this.rental.depositAmount = car.deposit;
    return this;
  }

  /**
   * Set rental dates
   */
  public setDates(startDate: Date, expectedEndDate: Date): this {
    this.rental.startDate = startDate;
    this.rental.expectedEndDate = expectedEndDate;
    return this;
  }

  /**
   * Calculate cost using pricing strategy
   */
  public calculateCost(pricingStrategy: PricingStrategy): this {
    const days = this.calculateDays();
    if (this.rental.car) {
      this.rental.totalCost = pricingStrategy.calculatePrice(
        this.rental.car,
        days
      );
    }
    return this;
  }

  /**
   * Set rental status
   */
  public setStatus(status: RentalStatus): this {
    this.rental.status = status;
    return this;
  }

  /**
   * Set penalty amount
   */
  public setPenaltyAmount(amount: number): this {
    this.rental.penaltyAmount = amount;
    return this;
  }

  /**
   * Calculate number of rental days
   */
  private calculateDays(): number {
    if (!this.rental.startDate || !this.rental.expectedEndDate) {
      throw new Error('Start date and expected end date must be set');
    }
    const diff = this.rental.expectedEndDate.getTime() - 
                 this.rental.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Build and return the rental object
   */
  public build(): Rental {
    if (!this.rental.client || !this.rental.car || !this.rental.startDate) {
      throw new Error('Missing required rental fields: client, car, or startDate');
    }
    if (!this.rental.status) {
      this.rental.status = RentalStatus.ACTIVE;
    }
    if (!this.rental.penaltyAmount) {
      this.rental.penaltyAmount = 0;
    }
    return this.rental as Rental;
  }

  /**
   * Reset builder for reuse
   */
  public reset(): this {
    this.rental = {};
    return this;
  }
}

