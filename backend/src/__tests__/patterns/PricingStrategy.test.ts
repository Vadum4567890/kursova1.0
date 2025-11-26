import {
  PricingStrategy,
  BasePricingStrategy,
  YearBasedPricingStrategy,
  DurationBasedPricingStrategy,
  CombinedPricingStrategy,
  PricingContext,
} from '../../patterns/strategy/PricingStrategy';
import { Car } from '../../models/Car.entity';

describe('PricingStrategy', () => {
  const createMockCar = (overrides?: Partial<Car>): Car => ({
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
    imageUrls: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Car);

  describe('BasePricingStrategy', () => {
    it('should calculate price as pricePerDay * days', () => {
      const strategy = new BasePricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      expect(strategy.calculatePrice(car, 1)).toBe(1000);
      expect(strategy.calculatePrice(car, 5)).toBe(5000);
      expect(strategy.calculatePrice(car, 10)).toBe(10000);
    });

    it('should handle zero days', () => {
      const strategy = new BasePricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      expect(strategy.calculatePrice(car, 0)).toBe(0);
    });
  });

  describe('YearBasedPricingStrategy', () => {
    it('should apply 1.2x multiplier for very new cars (age <= 2)', () => {
      const strategy = new YearBasedPricingStrategy();
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 1, pricePerDay: 1000 });

      const price = strategy.calculatePrice(car, 1);
      expect(price).toBe(1200); // 1000 * 1.2
    });

    it('should apply 1.0x multiplier for new cars (age 3-5)', () => {
      const strategy = new YearBasedPricingStrategy();
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 4, pricePerDay: 1000 });

      const price = strategy.calculatePrice(car, 1);
      expect(price).toBe(1000); // 1000 * 1.0
    });

    it('should apply 0.9x multiplier for older cars (age 6-10)', () => {
      const strategy = new YearBasedPricingStrategy();
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 8, pricePerDay: 1000 });

      const price = strategy.calculatePrice(car, 1);
      expect(price).toBe(900); // 1000 * 0.9
    });

    it('should apply 0.8x multiplier for old cars (age > 10)', () => {
      const strategy = new YearBasedPricingStrategy();
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 15, pricePerDay: 1000 });

      const price = strategy.calculatePrice(car, 1);
      expect(price).toBe(800); // 1000 * 0.8
    });

    it('should calculate correctly for multiple days', () => {
      const strategy = new YearBasedPricingStrategy();
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 1, pricePerDay: 1000 });

      const price = strategy.calculatePrice(car, 5);
      expect(price).toBe(6000); // 1000 * 5 * 1.2
    });
  });

  describe('DurationBasedPricingStrategy', () => {
    it('should apply no discount for rentals less than 7 days', () => {
      const strategy = new DurationBasedPricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      expect(strategy.calculatePrice(car, 1)).toBe(1000);
      expect(strategy.calculatePrice(car, 6)).toBe(6000);
    });

    it('should apply 5% discount for rentals 7-13 days', () => {
      const strategy = new DurationBasedPricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      const price7Days = strategy.calculatePrice(car, 7);
      expect(price7Days).toBe(6650); // 7000 * 0.95

      const price13Days = strategy.calculatePrice(car, 13);
      expect(price13Days).toBe(12350); // 13000 * 0.95
    });

    it('should apply 10% discount for rentals 14-29 days', () => {
      const strategy = new DurationBasedPricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      const price14Days = strategy.calculatePrice(car, 14);
      expect(price14Days).toBe(12600); // 14000 * 0.90

      const price29Days = strategy.calculatePrice(car, 29);
      expect(price29Days).toBe(26100); // 29000 * 0.90
    });

    it('should apply 15% discount for rentals 30+ days', () => {
      const strategy = new DurationBasedPricingStrategy();
      const car = createMockCar({ pricePerDay: 1000 });

      const price30Days = strategy.calculatePrice(car, 30);
      expect(price30Days).toBe(25500); // 30000 * 0.85

      const price60Days = strategy.calculatePrice(car, 60);
      expect(price60Days).toBe(51000); // 60000 * 0.85
    });
  });

  describe('CombinedPricingStrategy', () => {
    it('should return average of multiple strategies', () => {
      const baseStrategy = new BasePricingStrategy();
      const yearStrategy = new YearBasedPricingStrategy();
      const durationStrategy = new DurationBasedPricingStrategy();
      
      const combined = new CombinedPricingStrategy([baseStrategy, yearStrategy, durationStrategy]);
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 1, pricePerDay: 1000 });

      const price = combined.calculatePrice(car, 7);
      
      // Base: 7000
      // Year (1.2x): 8400
      // Duration (5% off): 6650
      // Average: (7000 + 8400 + 6650) / 3 = 7350
      expect(price).toBeCloseTo(7350, 0);
    });

    it('should return base price if no strategies provided', () => {
      const combined = new CombinedPricingStrategy([]);
      const car = createMockCar({ pricePerDay: 1000 });

      const price = combined.calculatePrice(car, 5);
      expect(price).toBe(5000); // Falls back to base calculation
    });

    it('should handle single strategy', () => {
      const baseStrategy = new BasePricingStrategy();
      const combined = new CombinedPricingStrategy([baseStrategy]);
      const car = createMockCar({ pricePerDay: 1000 });

      const price = combined.calculatePrice(car, 5);
      expect(price).toBe(5000);
    });
  });

  describe('PricingContext', () => {
    it('should use the set strategy to calculate price', () => {
      const baseStrategy = new BasePricingStrategy();
      const context = new PricingContext(baseStrategy);
      const car = createMockCar({ pricePerDay: 1000 });

      expect(context.calculatePrice(car, 5)).toBe(5000);
    });

    it('should allow changing strategy', () => {
      const baseStrategy = new BasePricingStrategy();
      const yearStrategy = new YearBasedPricingStrategy();
      const context = new PricingContext(baseStrategy);
      const currentYear = new Date().getFullYear();
      const car = createMockCar({ year: currentYear - 1, pricePerDay: 1000 });

      expect(context.calculatePrice(car, 1)).toBe(1000); // Base strategy

      context.setStrategy(yearStrategy);
      expect(context.calculatePrice(car, 1)).toBe(1200); // Year strategy (1.2x)
    });
  });
});

