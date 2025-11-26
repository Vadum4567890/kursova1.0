import { RentalService } from '../../services/RentalService';
import { Rental, RentalStatus } from '../../models/Rental.entity';
import { Car, CarStatus } from '../../models/Car.entity';
import { Client } from '../../models/Client.entity';
import { IRentalRepository } from '../../core/interfaces/IRentalRepository';
import { ICarRepository } from '../../core/interfaces/ICarRepository';
import { IClientRepository } from '../../core/interfaces/IClientRepository';
import { IPenaltyRepository } from '../../core/interfaces/IPenaltyRepository';

describe('RentalService', () => {
  let rentalService: RentalService;
  let mockRentalRepository: jest.Mocked<IRentalRepository>;
  let mockCarRepository: jest.Mocked<ICarRepository>;
  let mockClientRepository: jest.Mocked<IClientRepository>;
  let mockPenaltyRepository: jest.Mocked<IPenaltyRepository>;

  const createMockCar = (overrides?: Partial<Car>): Car => ({
    id: 1,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    pricePerDay: 1000,
    deposit: 5000,
    status: CarStatus.AVAILABLE,
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

  const createMockClient = (overrides?: Partial<Client>): Client => ({
    id: 1,
    fullName: 'Test Client',
    email: 'test@example.com',
    phone: '+380123456789',
    address: 'Test Address',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    // Create QueryBuilder mock
    const mockQueryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    // Create mocks
    mockRentalRepository = {
      findById: jest.fn(),
      findByCarId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findAllWithRelations: jest.fn(),
      findByDateRange: jest.fn(),
      findByClientId: jest.fn(),
      getRepository: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockCarRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    mockClientRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    mockPenaltyRepository = {
      findByRentalId: jest.fn(),
      create: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    rentalService = new RentalService(
      mockRentalRepository,
      mockPenaltyRepository,
      mockCarRepository,
      mockClientRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ensure findByCarId always returns an array
    mockRentalRepository.findByCarId.mockResolvedValue([]);
  });

  describe('createRental', () => {
    it('should create a rental successfully', async () => {
      const clientId = 1;
      const carId = 1;
      const startDate = new Date('2025-12-01');
      const expectedEndDate = new Date('2025-12-05');

      const mockCar = createMockCar({ id: carId });
      const mockClient = createMockClient({ id: clientId });
      const mockRental = createMockRental({
        startDate,
        expectedEndDate,
      });

      mockCarRepository.findById.mockResolvedValue(mockCar);
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.create.mockResolvedValue(mockRental);

      const result = await rentalService.createRental(
        clientId,
        carId,
        startDate,
        expectedEndDate
      );

      expect(result).toBeDefined();
      expect(mockRentalRepository.create).toHaveBeenCalled();
      expect(result.status).toBe(RentalStatus.ACTIVE);
    });

    it('should throw error if start date is after expected end date', async () => {
      const startDate = new Date('2025-12-05');
      const expectedEndDate = new Date('2025-12-01');

      await expect(
        rentalService.createRental(1, 1, startDate, expectedEndDate)
      ).rejects.toThrow('Start date must be before expected end date');
    });

    it('should throw error if start date is in the past', async () => {
      const startDate = new Date('2020-01-01');
      const expectedEndDate = new Date('2020-01-05');

      await expect(
        rentalService.createRental(1, 1, startDate, expectedEndDate)
      ).rejects.toThrow('Start date cannot be in the past');
    });

    it('should throw error if car is not found', async () => {
      mockCarRepository.findById.mockResolvedValue(null);

      await expect(
        rentalService.createRental(1, 1, new Date('2025-12-01'), new Date('2025-12-05'))
      ).rejects.toThrow('Car not found');
    });

    it('should throw error if car is in maintenance', async () => {
      const mockCar = createMockCar({ status: CarStatus.MAINTENANCE });
      mockCarRepository.findById.mockResolvedValue(mockCar);

      await expect(
        rentalService.createRental(1, 1, new Date('2025-12-01'), new Date('2025-12-05'))
      ).rejects.toThrow('Car is in maintenance and cannot be rented');
    });

    it('should throw error if dates overlap with existing rental', async () => {
      const mockCar = createMockCar();
      const existingRental = createMockRental({
        startDate: new Date('2025-12-01'),
        expectedEndDate: new Date('2025-12-05'),
        status: RentalStatus.ACTIVE,
      });

      mockCarRepository.findById.mockResolvedValue(mockCar);
      mockRentalRepository.findByCarId.mockResolvedValue([existingRental]);

      await expect(
        rentalService.createRental(
          1,
          1,
          new Date('2025-12-03'), // Overlaps
          new Date('2025-12-07')
        )
      ).rejects.toThrow('Car is already booked for the selected dates');
    });

    it('should allow rental if existing rental is completed', async () => {
      const mockCar = createMockCar();
      const completedRental = createMockRental({
        status: RentalStatus.COMPLETED,
        actualEndDate: new Date('2025-11-25'), // Ended in the past
      });
      const mockClient = createMockClient();
      const newRental = createMockRental();

      mockCarRepository.findById.mockResolvedValue(mockCar);
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockRentalRepository.findByCarId.mockResolvedValue([completedRental]);
      mockRentalRepository.create.mockResolvedValue(newRental);

      const result = await rentalService.createRental(
        1,
        1,
        new Date('2025-12-01'),
        new Date('2025-12-05')
      );

      expect(result).toBeDefined();
    });
  });

  describe('completeRental', () => {
    it('should complete rental on time successfully', async () => {
      const rental = createMockRental({
        startDate: new Date('2025-11-26'),
        expectedEndDate: new Date('2025-11-30'),
      });
      const completedRental = { ...rental, status: RentalStatus.COMPLETED, actualEndDate: new Date('2025-11-30') };

      // Create a fresh query builder for each call
      const mockQueryBuilder1 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(rental),
      };
      const mockQueryBuilder2 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(completedRental),
      };
      
      mockRentalRepository.getRepository
        .mockReturnValueOnce(mockQueryBuilder1)
        .mockReturnValueOnce(mockQueryBuilder2);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(completedRental);

      const result = await rentalService.completeRental(1, new Date('2025-11-30'));

      expect(result.status).toBe(RentalStatus.COMPLETED);
      expect(result.actualEndDate).toBeDefined();
      expect(mockCarRepository.updateStatus).toHaveBeenCalledWith(rental.car.id, CarStatus.AVAILABLE);
    });

    it('should complete rental early and recalculate deposit', async () => {
      // Initial rental: 4 days (26-30)
      // Base deposit: 5000, Additional: 150 * (4-1) = 450, Total: 5450
      const initialDeposit = 5000 + (1000 * 0.15 * 3); // 5450
      const rental = createMockRental({
        startDate: new Date('2025-11-26'),
        expectedEndDate: new Date('2025-11-30'),
        depositAmount: initialDeposit,
      });
      const completedRental = { ...rental, status: RentalStatus.COMPLETED };

      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(rental)
        .mockResolvedValueOnce(completedRental);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(completedRental);

      // Complete on 28th (2 days: 26-28)
      // Recalculated deposit: 5000 + (150 * 1) = 5150
      const result = await rentalService.completeRental(1, new Date('2025-11-28'));

      expect(result.status).toBe(RentalStatus.COMPLETED);
      expect(mockRentalRepository.update).toHaveBeenCalled();
      const updateCall = mockRentalRepository.update.mock.calls[0][1];
      // Early return: 5150 < 5450 (initial deposit for 4 days)
      expect(updateCall.depositAmount).toBe(5150);
      expect(updateCall.depositAmount).toBeLessThan(rental.depositAmount);
    });

    it('should complete rental late and calculate penalty', async () => {
      const rental = createMockRental({
        startDate: new Date('2025-11-26'),
        expectedEndDate: new Date('2025-11-30'),
        car: createMockCar({ pricePerDay: 1000 }),
      });
      const completedRental = { ...rental, status: RentalStatus.COMPLETED };

      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(rental)
        .mockResolvedValueOnce(completedRental);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(completedRental);

      const result = await rentalService.completeRental(1, new Date('2025-12-02')); // 2 days late

      expect(result.status).toBe(RentalStatus.COMPLETED);
      expect(mockRentalRepository.update).toHaveBeenCalled();
      const updateCall = mockRentalRepository.update.mock.calls[0][1];
      // Penalty = 2 days * 1000 * 0.5 = 1000
      expect(updateCall.penaltyAmount).toBe(1000);
    });

    it('should complete rental on the same day as start date', async () => {
      const rental = createMockRental({
        startDate: new Date('2025-11-26T10:00:00'),
        expectedEndDate: new Date('2025-11-30'),
      });
      const completedRental = { ...rental, status: RentalStatus.COMPLETED };

      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(rental)
        .mockResolvedValueOnce(completedRental);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(completedRental);

      const result = await rentalService.completeRental(1, new Date('2025-11-26T14:00:00'));

      expect(result.status).toBe(RentalStatus.COMPLETED);
      expect(mockRentalRepository.update).toHaveBeenCalled();
      const updateCall = mockRentalRepository.update.mock.calls[0][1];
      // Should calculate for minimum 1 day
      expect(updateCall.totalCost).toBeGreaterThan(0);
    });

    it('should throw error if rental not found', async () => {
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(rentalService.completeRental(999)).rejects.toThrow('Rental not found');
    });

    it('should throw error if rental is not active', async () => {
      const rental = createMockRental({ status: RentalStatus.COMPLETED });
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(rental);

      await expect(rentalService.completeRental(1)).rejects.toThrow('Rental is not active');
    });

    it('should throw error if actual end date is before start date', async () => {
      const rental = createMockRental({
        startDate: new Date('2025-11-26'),
        expectedEndDate: new Date('2025-11-30'),
      });
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(rental);

      await expect(
        rentalService.completeRental(1, new Date('2025-11-25'))
      ).rejects.toThrow('Actual end date cannot be before start date');
    });

    it('should not update car status if other active rentals exist', async () => {
      const rental = createMockRental();
      const otherRental = createMockRental({ id: 2, car: rental.car });
      const completedRental = { ...rental, status: RentalStatus.COMPLETED };

      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(rental)
        .mockResolvedValueOnce(completedRental);
      mockRentalRepository.findByCarId.mockResolvedValue([otherRental]);
      mockRentalRepository.update.mockResolvedValue(completedRental);

      await rentalService.completeRental(1);

      expect(mockCarRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelRental', () => {
    it('should cancel rental before start date with full refund', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const rental = createMockRental({
        startDate: futureDate,
        expectedEndDate: new Date(futureDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        depositAmount: 5000,
      });
      const cancelledRental = { ...rental, status: RentalStatus.CANCELLED, actualEndDate: new Date() };

      // Create separate query builders for each getRentalById call
      const mockQueryBuilder1 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(rental),
      };
      const mockQueryBuilder2 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(cancelledRental),
      };
      
      mockRentalRepository.getRepository
        .mockReturnValueOnce(mockQueryBuilder1)
        .mockReturnValueOnce(mockQueryBuilder2);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(cancelledRental);

      const result = await rentalService.cancelRental(1);

      expect(result.status).toBe(RentalStatus.CANCELLED);
      expect(mockRentalRepository.update).toHaveBeenCalled();
      const updateCall = mockRentalRepository.update.mock.calls[0][1];
      expect(updateCall.totalCost).toBe(0);
      expect(updateCall.penaltyAmount).toBe(0);
    });

    it('should cancel rental after start with charge for actual days', async () => {
      const rental = createMockRental({
        startDate: new Date('2025-11-20'),
        expectedEndDate: new Date('2025-11-30'),
        depositAmount: 5000,
      });
      const cancelledRental = { ...rental, status: RentalStatus.CANCELLED, actualEndDate: new Date('2025-11-25') };

      // Create separate query builders for each getRentalById call
      const mockQueryBuilder1 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(rental),
      };
      const mockQueryBuilder2 = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(cancelledRental),
      };
      
      mockRentalRepository.getRepository
        .mockReturnValueOnce(mockQueryBuilder1)
        .mockReturnValueOnce(mockQueryBuilder2);
      mockRentalRepository.findByCarId.mockResolvedValue([]);
      mockRentalRepository.update.mockResolvedValue(cancelledRental);

      const result = await rentalService.cancelRental(1, new Date('2025-11-25'));

      expect(result.status).toBe(RentalStatus.CANCELLED);
      expect(mockRentalRepository.update).toHaveBeenCalled();
      const updateCall = mockRentalRepository.update.mock.calls[0][1];
      expect(updateCall.totalCost).toBeGreaterThan(0); // Should charge for actual days
    });

    it('should throw error if rental is not active', async () => {
      const rental = createMockRental({ status: RentalStatus.COMPLETED });
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(rental);

      await expect(rentalService.cancelRental(1)).rejects.toThrow('Only active rentals can be cancelled');
    });
  });

  describe('getRentalById', () => {
    it('should return rental by id', async () => {
      const rental = createMockRental();
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(rental);

      const result = await rentalService.getRentalById(1);

      expect(result).toEqual(rental);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('rental.id = :id', { id: 1 });
    });

    it('should return null if rental not found', async () => {
      const mockQueryBuilder = mockRentalRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await rentalService.getRentalById(999);

      expect(result).toBeNull();
    });
  });
});

