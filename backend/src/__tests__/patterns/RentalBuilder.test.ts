import { RentalBuilder } from '../../patterns/builder/RentalBuilder';
import { Rental, RentalStatus } from '../../models/Rental.entity';
import { Client } from '../../models/Client.entity';
import { Car } from '../../models/Car.entity';
import { BasePricingStrategy } from '../../patterns/strategy/PricingStrategy';

describe('RentalBuilder', () => {
  const createMockCar = (): Car => ({
    id: 1,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    pricePerDay: 1000,
    deposit: 5000,
    status: 'available' as any,
    type: 'economy',
    bodyType: 'sedan',
    driveType: 'front-wheel',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engineSize: 1.8,
    seats: 5,
    imageUrl: 'test.jpg',
    imageUrls: '[]',
    rentals: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Car);

  const createMockClient = (): Client => ({
    id: 1,
    fullName: 'Test Client',
    email: 'test@example.com',
    phone: '+380123456789',
    address: 'Test Address',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Client);

  describe('setClient', () => {
    it('should set client and return builder instance', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();

      const result = builder.setClient(client);

      expect(result).toBe(builder);
    });
  });

  describe('setCar', () => {
    it('should set car and return builder instance', () => {
      const builder = new RentalBuilder();
      const car = createMockCar();

      const result = builder.setCar(car);

      expect(result).toBe(builder);
    });
  });

  describe('setDates', () => {
    it('should set dates and calculate deposit for 1 day', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-27');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);

      const rental = builder.build();
      expect(rental.startDate).toEqual(startDate);
      expect(rental.expectedEndDate).toEqual(endDate);
      // Base deposit only (no additional for 1 day)
      expect(rental.depositAmount).toBe(5000);
    });

    it('should calculate deposit with additional amount for multiple days', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30'); // 4 days

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);

      const rental = builder.build();
      // Base deposit: 5000
      // Additional: (4-1) * 1000 * 0.15 = 3 * 150 = 450
      // Total: 5450
      expect(rental.depositAmount).toBe(5450);
    });

    it('should handle dates spanning multiple months', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-12-05'); // 9 days

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);

      const rental = builder.build();
      expect(rental.startDate).toEqual(startDate);
      expect(rental.expectedEndDate).toEqual(endDate);
      // Base: 5000, Additional: (9-1) * 150 = 1200, Total: 6200
      expect(rental.depositAmount).toBe(6200);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost using pricing strategy', () => {
      const builder = new RentalBuilder();
      const car = createMockCar();
      const client = createMockClient();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30'); // 4 days
      const strategy = new BasePricingStrategy();

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);
      builder.calculateCost(strategy);

      const rental = builder.build();
      // 4 days * 1000 = 4000
      expect(rental.totalCost).toBe(4000);
    });

    it('should throw error if dates not set before calculating cost', () => {
      const builder = new RentalBuilder();
      const car = createMockCar();
      const strategy = new BasePricingStrategy();

      builder.setCar(car);

      expect(() => builder.calculateCost(strategy)).toThrow('Start date and expected end date must be set');
    });
  });

  describe('setStatus', () => {
    it('should set rental status', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);
      builder.setStatus(RentalStatus.COMPLETED);

      const rental = builder.build();
      expect(rental.status).toBe(RentalStatus.COMPLETED);
    });
  });

  describe('setPenaltyAmount', () => {
    it('should set penalty amount', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);
      builder.setPenaltyAmount(500);

      const rental = builder.build();
      expect(rental.penaltyAmount).toBe(500);
    });
  });

  describe('build', () => {
    it('should build rental with all required fields', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');
      const strategy = new BasePricingStrategy();

      builder
        .setClient(client)
        .setCar(car)
        .setDates(startDate, endDate)
        .calculateCost(strategy)
        .setStatus(RentalStatus.ACTIVE);

      const rental = builder.build();

      expect(rental.client).toBe(client);
      expect(rental.car).toBe(car);
      expect(rental.startDate).toEqual(startDate);
      expect(rental.expectedEndDate).toEqual(endDate);
      expect(rental.status).toBe(RentalStatus.ACTIVE);
      expect(rental.totalCost).toBe(4000);
      expect(rental.penaltyAmount).toBe(0);
    });

    it('should throw error if client is missing', () => {
      const builder = new RentalBuilder();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setCar(car);
      builder.setDates(startDate, endDate);

      expect(() => builder.build()).toThrow('Missing required rental fields: client, car, or startDate');
    });

    it('should throw error if car is missing', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setDates(startDate, endDate);

      expect(() => builder.build()).toThrow('Missing required rental fields: client, car, or startDate');
    });

    it('should throw error if startDate is missing', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();

      builder.setClient(client);
      builder.setCar(car);

      expect(() => builder.build()).toThrow('Missing required rental fields: client, car, or startDate');
    });

    it('should set default status to ACTIVE if not set', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);

      const rental = builder.build();
      expect(rental.status).toBe(RentalStatus.ACTIVE);
    });

    it('should set default penaltyAmount to 0 if not set', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);

      const rental = builder.build();
      expect(rental.penaltyAmount).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset builder for reuse', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');

      builder.setClient(client);
      builder.setCar(car);
      builder.setDates(startDate, endDate);
      builder.build();

      builder.reset();

      expect(() => builder.build()).toThrow('Missing required rental fields: client, car, or startDate');
    });
  });

  describe('fluent interface', () => {
    it('should support method chaining', () => {
      const builder = new RentalBuilder();
      const client = createMockClient();
      const car = createMockCar();
      const startDate = new Date('2025-11-26');
      const endDate = new Date('2025-11-30');
      const strategy = new BasePricingStrategy();

      const rental = builder
        .setClient(client)
        .setCar(car)
        .setDates(startDate, endDate)
        .calculateCost(strategy)
        .setStatus(RentalStatus.ACTIVE)
        .setPenaltyAmount(100)
        .build();

      expect(rental).toBeDefined();
      expect(rental.client).toBe(client);
      expect(rental.car).toBe(car);
    });
  });
});

