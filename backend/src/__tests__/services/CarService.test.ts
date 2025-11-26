import { CarService } from '../../services/CarService';
import { Car, CarStatus, CarType } from '../../models/Car.entity';
import { ICarRepository } from '../../core/interfaces/ICarRepository';

// Mock AppDataSource before importing
const mockRentalQueryBuilder = {
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(0),
};

jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRentalQueryBuilder),
  },
}));

describe('CarService', () => {
  let carService: CarService;
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
    ...overrides,
  } as Car);

  beforeEach(() => {
    mockCarRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    // Mock QueryBuilder
    const mockQueryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    mockCarRepository.getRepository.mockReturnValue(mockQueryBuilder as any);

    carService = new CarService(mockCarRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset query builder mocks
    mockRentalQueryBuilder.getCount.mockResolvedValue(0);
  });

  describe('getAllCars', () => {
    it('should return all cars without pagination', async () => {
      const cars = [createMockCar(), createMockCar({ id: 2 })];
      mockCarRepository.findAll.mockResolvedValue(cars);

      const result = await carService.getAllCars();

      expect(result).toEqual(cars);
      expect(mockCarRepository.findAll).toHaveBeenCalled();
    });

    it('should parse imageUrls from string to array', async () => {
      const carWithStringUrls = createMockCar({
        imageUrls: '["url1.jpg", "url2.jpg"]' as any,
      });
      mockCarRepository.findAll.mockResolvedValue([carWithStringUrls]);

      const result = await carService.getAllCars();

      expect(Array.isArray(result[0].imageUrls)).toBe(true);
      expect(result[0].imageUrls).toEqual(['url1.jpg', 'url2.jpg']);
    });

    it('should handle invalid JSON in imageUrls', async () => {
      const carWithInvalidJson = createMockCar({
        imageUrls: 'invalid json' as any,
      });
      mockCarRepository.findAll.mockResolvedValue([carWithInvalidJson]);

      const result = await carService.getAllCars();

      expect(result[0].imageUrls).toEqual([]);
    });

    it('should return paginated cars with filters', async () => {
      const cars = [createMockCar()];
      const mockQueryBuilder = mockCarRepository.getRepository().createQueryBuilder();

      // Ensure getCount is called and returns a value
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(cars);

      const pagination = { page: 1, limit: 10, offset: 0 };
      const filters = { type: CarType.ECONOMY, status: CarStatus.AVAILABLE };
      const sort = { field: 'brand', order: 'ASC' as const };

      const result = await carService.getAllCars(pagination, filters, sort);

      expect(result).toBeDefined();
      expect(result.data).toEqual(cars);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      const mockQueryBuilder = mockCarRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await carService.getAllCars(
        { page: 1, limit: 10, offset: 0 },
        { type: CarType.PREMIUM }
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('car.type = :type', { type: CarType.PREMIUM });
    });

    it('should filter by status', async () => {
      const mockQueryBuilder = mockCarRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await carService.getAllCars(
        { page: 1, limit: 10, offset: 0 },
        { status: CarStatus.RENTED }
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('car.status = :status', { status: CarStatus.RENTED });
    });

    it('should filter by brand (case insensitive)', async () => {
      const mockQueryBuilder = mockCarRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await carService.getAllCars(
        { page: 1, limit: 10, offset: 0 },
        { brand: 'Toyota' }
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('car.brand ILIKE :brand', { brand: '%Toyota%' });
    });

    it('should apply default sorting by id ASC', async () => {
      const mockQueryBuilder = mockCarRepository.getRepository().createQueryBuilder();
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await carService.getAllCars({ page: 1, limit: 10, offset: 0 });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('car.id', 'ASC');
    });
  });

  describe('getCarById', () => {
    it('should return car by id', async () => {
      const car = createMockCar();
      mockCarRepository.findById.mockResolvedValue(car);

      const result = await carService.getCarById(1);

      expect(result).toEqual(car);
      expect(mockCarRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if car not found', async () => {
      mockCarRepository.findById.mockResolvedValue(null);

      const result = await carService.getCarById(999);

      expect(result).toBeNull();
    });
  });

  describe('createCar', () => {
    it('should create a new car', async () => {
      const carData = createMockCar();
      mockCarRepository.create.mockResolvedValue(carData);

      const result = await carService.createCar(carData);

      expect(result).toEqual(carData);
      expect(mockCarRepository.create).toHaveBeenCalled();
      // Check that create was called with an object containing the main car properties
      const createCall = mockCarRepository.create.mock.calls[0][0];
      expect(createCall).toMatchObject({
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
      });
    });
  });

  describe('updateCar', () => {
    it('should update existing car', async () => {
      const car = createMockCar();
      const updateData = { brand: 'Honda' };
      const updatedCar = { ...car, ...updateData, imageUrls: '[]' };

      mockCarRepository.findById.mockResolvedValue(car);
      mockCarRepository.update.mockResolvedValue(updatedCar);

      const result = await carService.updateCar(1, updateData);

      expect(result).toEqual(updatedCar);
      expect(mockCarRepository.update).toHaveBeenCalledWith(1, expect.objectContaining(updateData));
    });

    it('should throw error if car not found', async () => {
      mockCarRepository.findById.mockResolvedValue(null);

      await expect(carService.updateCar(999, {})).rejects.toThrow('Car not found');
      // Verify that update was not called
      expect(mockCarRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCar', () => {
    it('should delete car by id', async () => {
      const car = createMockCar();
      mockRentalQueryBuilder.getCount.mockResolvedValue(0);
      mockCarRepository.findById.mockResolvedValue(car);
      mockCarRepository.delete.mockResolvedValue(true);

      const result = await carService.deleteCar(1);

      expect(result).toBe(true);
      expect(mockCarRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error if car has active rentals', async () => {
      const car = createMockCar();
      mockRentalQueryBuilder.getCount.mockResolvedValue(2); // 2 active rentals
      mockCarRepository.findById.mockResolvedValue(car);

      await expect(carService.deleteCar(1)).rejects.toThrow('Cannot delete car: it has 2 active rental(s)');
    });

    it('should throw error if car not found', async () => {
      mockCarRepository.findById.mockResolvedValue(null);

      await expect(carService.deleteCar(999)).rejects.toThrow('Car not found');
    });
  });

  describe('updateCarStatus', () => {
    it('should update car status', async () => {
      const car = createMockCar();
      const updatedCar = { ...car, status: CarStatus.RENTED };
      mockCarRepository.updateStatus.mockResolvedValue(updatedCar);

      const result = await carService.updateCarStatus(1, CarStatus.RENTED);

      expect(result).toEqual(updatedCar);
      expect(mockCarRepository.updateStatus).toHaveBeenCalledWith(1, CarStatus.RENTED);
    });

    it('should update car status even if car not found in repository', async () => {
      // updateCarStatus doesn't check if car exists, it just calls updateStatus
      const updatedCar = createMockCar({ id: 999, status: CarStatus.AVAILABLE });
      mockCarRepository.updateStatus.mockResolvedValue(updatedCar);

      const result = await carService.updateCarStatus(999, CarStatus.AVAILABLE);

      expect(result).toEqual(updatedCar);
      expect(mockCarRepository.updateStatus).toHaveBeenCalledWith(999, CarStatus.AVAILABLE);
    });
  });
});

