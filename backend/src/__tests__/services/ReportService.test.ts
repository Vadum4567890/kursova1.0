import { ReportService } from '../../services/ReportService';
import { IRentalRepository } from '../../core/interfaces/IRentalRepository';
import { ICarRepository } from '../../core/interfaces/ICarRepository';
import { Car, CarStatus, CarType } from '../../models/Car.entity';
import { Rental, RentalStatus } from '../../models/Rental.entity';
import { Client } from '../../models/Client.entity';

describe('ReportService', () => {
  let reportService: ReportService;
  let mockRentalRepository: jest.Mocked<IRentalRepository>;
  let mockCarRepository: jest.Mocked<ICarRepository>;

  const createMockCar = (overrides?: Partial<Car>): Car => ({
    id: 1,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    pricePerDay: 1000,
    deposit: 5000,
    status: CarStatus.AVAILABLE,
    type: CarType.ECONOMY,
    bodyType: 'sedan',
    driveType: 'front-wheel',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engineSize: 1.8,
    seats: 5,
    imageUrl: 'test.jpg',
    imageUrls: '[]',
    createdAt: new Date(),
    updatedAt: new Date(),
    rentals: [],
    ...overrides,
  } as Car);

  const createMockClient = (overrides?: Partial<Client>): Client => ({
    id: 1,
    fullName: 'Test Client',
    email: 'test@example.com',
    phone: '+380123456789',
    address: 'Test Address',
    createdAt: new Date(),
    updatedAt: new Date(),
    rentals: [],
    ...overrides,
  } as Client);

  const createMockRental = (overrides?: Partial<Rental>): Rental => {
    const startDate = new Date('2025-11-26');
    const expectedEndDate = new Date('2025-11-30');
    
    return {
      id: 1,
      client: createMockClient(),
      car: createMockCar(),
      startDate,
      expectedEndDate,
      depositAmount: 5000,
      totalCost: 4000,
      penaltyAmount: 0,
      status: RentalStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Rental;
  };

  beforeEach(() => {
    mockRentalRepository = {
      findAll: jest.fn(),
      findAllWithRelations: jest.fn(),
      findById: jest.fn(),
      findByCarId: jest.fn(),
      findByClientId: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      findActiveRentals: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockCarRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findAvailableCars: jest.fn(),
      findByStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    reportService = new ReportService(mockRentalRepository, mockCarRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFinancialReport', () => {
    it('should calculate net revenue correctly for completed rental', async () => {
      const completedRental = createMockRental({
        id: 1,
        status: RentalStatus.COMPLETED,
        totalCost: 4000,
        penaltyAmount: 500,
        depositAmount: 5000,
      });

      mockRentalRepository.findAll.mockResolvedValue([completedRental]);

      const result = await reportService.generateFinancialReport();

      expect(result.rentals.completed).toBe(1);
      expect(result.totalRevenue).toBe(4500); // cost + penalty
      expect(result.totalPenalties).toBe(500);
      expect(result.totalDeposits).toBe(5000);
      // Net revenue: cost + penalty = 4000 + 500 = 4500
      expect(result.netRevenue).toBe(4500);
      expect(result.debug.depositsToReturnFromCompleted).toBe(4500); // deposit - penalty
    });

    it('should calculate net revenue correctly for cancelled rental', async () => {
      const cancelledRental = createMockRental({
        id: 1,
        status: RentalStatus.CANCELLED,
        totalCost: 2000,
        penaltyAmount: 1000,
        depositAmount: 5000,
      });

      mockRentalRepository.findAll.mockResolvedValue([cancelledRental]);

      const result = await reportService.generateFinancialReport();

      expect(result.rentals.cancelled).toBe(1);
      // Net revenue: max(0, cost + penalty - depositToReturn)
      // depositToReturn = max(0, 5000 - 1000) = 4000
      // revenue = max(0, 2000 + 1000 - 4000) = 0
      expect(result.netRevenue).toBe(0);
      expect(result.debug.cancelledDepositsToReturn).toBe(4000);
    });

    it('should handle cancelled rental with penalty exceeding deposit', async () => {
      const cancelledRental = createMockRental({
        id: 1,
        status: RentalStatus.CANCELLED,
        totalCost: 2000,
        penaltyAmount: 6000, // Exceeds deposit
        depositAmount: 5000,
      });

      mockRentalRepository.findAll.mockResolvedValue([cancelledRental]);

      const result = await reportService.generateFinancialReport();

      // depositToReturn = max(0, 5000 - 6000) = 0
      // revenue = max(0, 2000 + 6000 - 0) = 8000
      expect(result.netRevenue).toBe(8000);
      expect(result.debug.cancelledDepositsToReturn).toBe(0);
    });

    it('should not include active rentals in net revenue', async () => {
      const activeRental = createMockRental({
        id: 1,
        status: RentalStatus.ACTIVE,
        totalCost: 4000,
        depositAmount: 5000,
      });
      const completedRental = createMockRental({
        id: 2,
        status: RentalStatus.COMPLETED,
        totalCost: 6000,
        depositAmount: 5000,
      });

      mockRentalRepository.findAll.mockResolvedValue([activeRental, completedRental]);

      const result = await reportService.generateFinancialReport();

      // Net revenue only from completed
      expect(result.netRevenue).toBe(6000);
      expect(result.totalRevenue).toBe(10000); // includes expected from active
    });

    it('should filter by date range correctly', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      
      const rentalInRange = createMockRental({
        id: 1,
        status: RentalStatus.COMPLETED,
        totalCost: 4000,
        startDate: new Date('2025-11-15'),
      });
      const rentalOutOfRange = createMockRental({
        id: 2,
        status: RentalStatus.COMPLETED,
        totalCost: 6000,
        startDate: new Date('2025-12-05'),
      });

      // findByDateRange should only return rentals in range
      mockRentalRepository.findByDateRange.mockResolvedValue([rentalInRange]);

      const result = await reportService.generateFinancialReport(startDate, endDate);

      // Should only include rentalInRange
      // Net revenue: cost + penalty = 4000 + 0 = 4000
      expect(result.netRevenue).toBe(4000);
      expect(result.rentals.completed).toBe(1);
    });

    it('should handle empty rentals', async () => {
      mockRentalRepository.findAll.mockResolvedValue([]);

      const result = await reportService.generateFinancialReport();

      expect(result.totalRevenue).toBe(0);
      expect(result.netRevenue).toBe(0);
      expect(result.totalPenalties).toBe(0);
      expect(result.totalDeposits).toBe(0);
    });

    it('should calculate deposits to return correctly', async () => {
      const completedRental1 = createMockRental({
        id: 1,
        status: RentalStatus.COMPLETED,
        depositAmount: 5000,
        penaltyAmount: 500,
      });
      const completedRental2 = createMockRental({
        id: 2,
        status: RentalStatus.COMPLETED,
        depositAmount: 5000,
        penaltyAmount: 0,
      });

      mockRentalRepository.findAll.mockResolvedValue([completedRental1, completedRental2]);

      const result = await reportService.generateFinancialReport();

      // depositToReturn1 = max(0, 5000 - 500) = 4500
      // depositToReturn2 = max(0, 5000 - 0) = 5000
      // Total = 9500
      expect(result.debug.depositsToReturnFromCompleted).toBe(9500);
    });
  });

  describe('generateOccupancyReport', () => {
    it('should calculate occupancy rate correctly', async () => {
      const cars = [
        createMockCar({ id: 1, status: CarStatus.AVAILABLE }),
        createMockCar({ id: 2, status: CarStatus.RENTED }),
        createMockCar({ id: 3, status: CarStatus.MAINTENANCE }),
      ];
      const activeRental = createMockRental({ id: 1, car: cars[1] });

      mockCarRepository.findAll.mockResolvedValue(cars);
      mockRentalRepository.findAll.mockResolvedValue([activeRental]);

      const result = await reportService.generateOccupancyReport();

      expect(result.totalCars).toBe(3);
      expect(result.availableCars).toBe(1);
      expect(result.rentedCars).toBe(1);
      expect(result.maintenanceCars).toBe(1);
      // 1 rented / 3 total = 33.33%
      expect(result.occupancyRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate occupancy by type correctly', async () => {
      const cars = [
        createMockCar({ id: 1, type: CarType.ECONOMY, status: CarStatus.AVAILABLE }),
        createMockCar({ id: 2, type: CarType.ECONOMY, status: CarStatus.RENTED }),
        createMockCar({ id: 3, type: CarType.BUSINESS, status: CarStatus.AVAILABLE }),
      ];

      mockCarRepository.findAll.mockResolvedValue(cars);
      mockRentalRepository.findAll.mockResolvedValue([]);

      const result = await reportService.generateOccupancyReport();

      expect(result.byType.economy.total).toBe(2);
      expect(result.byType.economy.available).toBe(1);
      expect(result.byType.economy.rented).toBe(1);
      expect(result.byType.business.total).toBe(1);
      expect(result.byType.business.available).toBe(1);
      expect(result.byType.business.rented).toBe(0);
    });

    it('should return 0% occupancy when no cars', async () => {
      mockCarRepository.findAll.mockResolvedValue([]);
      mockRentalRepository.findAll.mockResolvedValue([]);

      const result = await reportService.generateOccupancyReport();

      expect(result.occupancyRate).toBe(0);
    });
  });

  describe('generateAvailabilityReport', () => {
    it('should return correct availability counts', async () => {
      const availableCars = [
        createMockCar({ id: 1, status: CarStatus.AVAILABLE }),
        createMockCar({ id: 2, status: CarStatus.AVAILABLE }),
      ];
      const rentedCars = [
        createMockCar({ id: 3, status: CarStatus.RENTED }),
      ];
      const maintenanceCars = [
        createMockCar({ id: 4, status: CarStatus.MAINTENANCE }),
      ];

      mockCarRepository.findByStatus
        .mockResolvedValueOnce(availableCars)
        .mockResolvedValueOnce(rentedCars)
        .mockResolvedValueOnce(maintenanceCars);
      mockCarRepository.findAll.mockResolvedValue([...availableCars, ...rentedCars, ...maintenanceCars]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([]);

      const result = await reportService.generateAvailabilityReport();

      expect(result.availableCars).toBe(2);
      expect(result.unavailableCars).toBe(2); // rented + maintenance
      expect(result.maintenanceCars).toBe(1);
    });

    it('should show next available date for rented cars', async () => {
      const car = createMockCar({ id: 1, status: CarStatus.RENTED });
      const activeRental = createMockRental({
        id: 1,
        car,
        status: RentalStatus.ACTIVE,
        expectedEndDate: new Date('2025-12-05'),
      });

      mockCarRepository.findByStatus
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([car])
        .mockResolvedValueOnce([]);
      mockCarRepository.findAll.mockResolvedValue([car]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([activeRental]);

      const result = await reportService.generateAvailabilityReport();

      expect(result.cars).toHaveLength(1);
      expect(result.cars[0].nextAvailableDate).toBe(new Date('2025-12-05').toISOString());
    });
  });

  describe('generateCarReport', () => {
    it('should calculate occupancy rate correctly', async () => {
      const car = createMockCar({ id: 1 });
      const completedRental = createMockRental({
        id: 1,
        car,
        status: RentalStatus.COMPLETED,
        startDate: new Date('2025-11-01'),
        actualEndDate: new Date('2025-11-05'), // 4 days
      });

      mockCarRepository.findAll.mockResolvedValue([car]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([completedRental]);

      const result = await reportService.generateCarReport();

      expect(result.cars).toHaveLength(1);
      expect(result.cars[0].occupancy.totalRentalDays).toBe(4);
      // Period defaults to last 365 days
      expect(parseFloat(result.cars[0].occupancy.occupancyRate)).toBeGreaterThan(0);
    });

    it('should calculate financial metrics correctly', async () => {
      const car = createMockCar({ id: 1 });
      const completedRental1 = createMockRental({
        id: 1,
        car,
        status: RentalStatus.COMPLETED,
        totalCost: 4000,
        penaltyAmount: 500,
      });
      const completedRental2 = createMockRental({
        id: 2,
        car,
        status: RentalStatus.COMPLETED,
        totalCost: 6000,
        penaltyAmount: 0,
      });
      const activeRental = createMockRental({
        id: 3,
        car,
        status: RentalStatus.ACTIVE,
        totalCost: 8000,
      });

      mockCarRepository.findAll.mockResolvedValue([car]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([
        completedRental1,
        completedRental2,
        activeRental,
      ]);

      const result = await reportService.generateCarReport();

      expect(result.cars[0].financial.totalRevenue).toBe(10500); // 4000+500 + 6000
      expect(result.cars[0].financial.expectedRevenue).toBe(8000);
      expect(result.cars[0].financial.totalPenalties).toBe(500);
      // Net revenue: sum of (cost + penalty) for completed
      expect(result.cars[0].financial.netRevenue).toBe(10500); // 4000+500 + 6000
      expect(result.cars[0].financial.averageRevenuePerRental).toBe(5250); // 10500 / 2
    });

    it('should filter by date range correctly', async () => {
      const car = createMockCar({ id: 1 });
      const rentalInRange = createMockRental({
        id: 1,
        car,
        status: RentalStatus.COMPLETED,
        totalCost: 4000,
        startDate: new Date('2025-11-15'),
      });
      const rentalOutOfRange = createMockRental({
        id: 2,
        car,
        status: RentalStatus.COMPLETED,
        totalCost: 6000,
        startDate: new Date('2025-12-05'),
      });

      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');

      mockCarRepository.findAll.mockResolvedValue([car]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([rentalInRange, rentalOutOfRange]);

      const result = await reportService.generateCarReport(startDate, endDate);

      // Should only include rentalInRange
      expect(result.cars[0].financial.totalRevenue).toBe(4000);
      expect(result.cars[0].occupancy.rentalCount).toBe(1);
    });

    it('should handle active rental in occupancy calculation', async () => {
      const car = createMockCar({ id: 1 });
      const activeRental = createMockRental({
        id: 1,
        car,
        status: RentalStatus.ACTIVE,
        startDate: new Date('2025-11-20'),
      });

      mockCarRepository.findAll.mockResolvedValue([car]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([activeRental]);

      const result = await reportService.generateCarReport();

      // Should calculate days from start to now
      expect(result.cars[0].occupancy.totalRentalDays).toBeGreaterThan(0);
      expect(result.cars[0].occupancy.activeCount).toBe(1);
    });

    it('should calculate summary correctly', async () => {
      const car1 = createMockCar({ id: 1 });
      const car2 = createMockCar({ id: 2 });
      
      const rental1 = createMockRental({
        id: 1,
        car: car1,
        status: RentalStatus.COMPLETED,
        totalCost: 4000,
        penaltyAmount: 500,
      });
      const rental2 = createMockRental({
        id: 2,
        car: car2,
        status: RentalStatus.COMPLETED,
        totalCost: 6000,
      });

      mockCarRepository.findAll.mockResolvedValue([car1, car2]);
      mockRentalRepository.findAllWithRelations.mockResolvedValue([rental1, rental2]);

      const result = await reportService.generateCarReport();

      expect(result.summary.totalCars).toBe(2);
      expect(result.summary.totalRevenue).toBe(10500); // 4000+500 + 6000
      expect(result.summary.totalNetRevenue).toBe(10500);
      expect(result.summary.totalPenalties).toBe(500);
    });
  });
});

