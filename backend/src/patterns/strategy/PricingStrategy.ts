import { Car } from '../../models/Car.entity';

/**
 * Strategy Pattern for different pricing calculation strategies
 * Allows flexible price calculation based on various factors
 */

/**
 * Pricing strategy interface
 */
export interface PricingStrategy {
  calculatePrice(car: Car, days: number): number;
}

/**
 * Base pricing strategy - simple price per day
 */
export class BasePricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    return car.pricePerDay * days;
  }
}

/**
 * Year-based pricing strategy
 * Newer cars cost more
 */
export class YearBasedPricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - car.year;
    
    // Price multiplier based on car age
    let multiplier = 1.0;
    if (age <= 2) {
      multiplier = 1.2; // Very new cars: +20%
    } else if (age <= 5) {
      multiplier = 1.0; // New cars: base price
    } else if (age <= 10) {
      multiplier = 0.9; // Older cars: -10%
    } else {
      multiplier = 0.8; // Old cars: -20%
    }
    
    return car.pricePerDay * days * multiplier;
  }
}

/**
 * Duration-based pricing strategy
 * Longer rentals get discounts
 */
export class DurationBasedPricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    let discount = 0;
    if (days >= 30) {
      discount = 0.15; // 15% discount for month+
    } else if (days >= 14) {
      discount = 0.10; // 10% discount for 2 weeks+
    } else if (days >= 7) {
      discount = 0.05; // 5% discount for week+
    }
    
    const basePrice = car.pricePerDay * days;
    return basePrice * (1 - discount);
  }
}

/**
 * Combined pricing strategy
 * Applies multiple strategies and returns average
 */
export class CombinedPricingStrategy implements PricingStrategy {
  private strategies: PricingStrategy[];

  constructor(strategies: PricingStrategy[]) {
    this.strategies = strategies;
  }

  public calculatePrice(car: Car, days: number): number {
    if (this.strategies.length === 0) {
      return car.pricePerDay * days;
    }

    let totalPrice = 0;
    for (const strategy of this.strategies) {
      totalPrice += strategy.calculatePrice(car, days);
    }
    return totalPrice / this.strategies.length;
  }
}

/**
 * Strategy context for managing pricing strategies
 */
export class PricingContext {
  private strategy: PricingStrategy;

  constructor(strategy: PricingStrategy) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: PricingStrategy): void {
    this.strategy = strategy;
  }

  public calculatePrice(car: Car, days: number): number {
    return this.strategy.calculatePrice(car, days);
  }
}

