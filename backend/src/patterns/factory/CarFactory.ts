import { Car, CarType } from '../../models/Car.entity';

/**
 * Factory Method Pattern for creating different types of cars
 * Each car type may have different initialization logic
 */

export interface CarData {
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  deposit: number;
  description?: string;
  imageUrl?: string;
}

/**
 * Abstract factory for car creation
 */
export abstract class CarFactory {
  /**
   * Abstract method to create a car
   */
  public abstract createCar(data: CarData): Car;

  /**
   * Template method for car registration
   */
  public registerCar(data: CarData): Car {
    const car = this.createCar(data);
    return car;
  }
}

/**
 * Economy car factory
 */
export class EconomyCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    const car = new Car();
    car.brand = data.brand;
    car.model = data.model;
    car.year = data.year;
    car.type = CarType.ECONOMY;
    car.pricePerDay = data.pricePerDay;
    car.deposit = data.deposit;
    car.description = data.description;
    car.imageUrl = data.imageUrl;
    return car;
  }
}

/**
 * Business car factory
 */
export class BusinessCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    const car = new Car();
    car.brand = data.brand;
    car.model = data.model;
    car.year = data.year;
    car.type = CarType.BUSINESS;
    // Business cars have higher base price
    car.pricePerDay = data.pricePerDay * 1.3;
    car.deposit = data.deposit * 1.2;
    car.description = data.description;
    car.imageUrl = data.imageUrl;
    return car;
  }
}

/**
 * Premium car factory
 */
export class PremiumCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    const car = new Car();
    car.brand = data.brand;
    car.model = data.model;
    car.year = data.year;
    car.type = CarType.PREMIUM;
    // Premium cars have significantly higher price
    car.pricePerDay = data.pricePerDay * 2.0;
    car.deposit = data.deposit * 1.5;
    car.description = data.description;
    car.imageUrl = data.imageUrl;
    return car;
  }
}

/**
 * Factory provider to get the appropriate factory
 */
export class CarFactoryProvider {
  public static getFactory(carType: CarType): CarFactory {
    switch (carType) {
      case CarType.ECONOMY:
        return new EconomyCarFactory();
      case CarType.BUSINESS:
        return new BusinessCarFactory();
      case CarType.PREMIUM:
        return new PremiumCarFactory();
      default:
        throw new Error(`Unknown car type: ${carType}`);
    }
  }
}

