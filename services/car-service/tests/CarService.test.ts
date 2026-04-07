import { CarService } from '../src/services/CarService';
import { CarCategory, CarStatus, FuelType, TransmissionType } from '../src/entities/Car.entity';

jest.mock('../src/kafka/producer', () => ({
  sendEvent: jest.fn().mockResolvedValue(undefined),
}));

describe('CarService', () => {
  function createService() {
    const service = new CarService();
    const carRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByLocation: jest.fn(),
    };
    const pricingRepository = {
      create: jest.fn(),
      findByCarId: jest.fn(),
      update: jest.fn(),
    };
    const imageRepository = {
      create: jest.fn(),
      findByCarId: jest.fn(),
      setPrimary: jest.fn(),
    };

    (service as any).carRepository = carRepository;
    (service as any).pricingRepository = pricingRepository;
    (service as any).imageRepository = imageRepository;

    return { service, carRepository, pricingRepository, imageRepository };
  }

  it('creates car and persists pricing when provided', async () => {
    const { service, carRepository, pricingRepository } = createService();
    const createdCar = {
      id: 'car-1',
      ownerId: 'owner-1',
      make: 'BMW',
      model: 'X5',
      year: 2023,
      category: CarCategory.SUV,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      status: CarStatus.ACTIVE,
    };

    carRepository.create.mockResolvedValue(createdCar);
    pricingRepository.create.mockResolvedValue({ carId: 'car-1', dailyRate: 100, depositAmount: 200 });
    carRepository.findById.mockResolvedValue({ ...createdCar, pricing: { dailyRate: 100, depositAmount: 200 } });

    const result = await service.createCar(
      {
        ownerId: 'owner-1',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        category: CarCategory.SUV,
        transmission: TransmissionType.AUTOMATIC,
        fuelType: FuelType.PETROL,
        seats: 5,
      } as any,
      { dailyRate: 100, depositAmount: 200 }
    );

    expect(carRepository.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1' }));
    expect(pricingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ carId: 'car-1', dailyRate: 100, depositAmount: 200 })
    );
    expect(result.id).toBe('car-1');
  });

  it('creates pricing record if it does not exist during pricing update', async () => {
    const { service, pricingRepository } = createService();
    const createdPricing = { carId: 'car-1', dailyRate: 150, depositAmount: 300 };

    pricingRepository.findByCarId.mockResolvedValue(null);
    pricingRepository.create.mockResolvedValue(createdPricing);

    const result = await service.updatePricing('car-1', { dailyRate: 150, depositAmount: 300 });

    expect(pricingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ carId: 'car-1', dailyRate: 150, depositAmount: 300 })
    );
    expect(result).toBe(createdPricing);
  });

  it('updates pricing record when it already exists', async () => {
    const { service, pricingRepository } = createService();
    const existingPricing = { carId: 'car-1', dailyRate: 100, depositAmount: 200 };
    const updatedPricing = { carId: 'car-1', dailyRate: 180, depositAmount: 250 };

    pricingRepository.findByCarId.mockResolvedValue(existingPricing);
    pricingRepository.update.mockResolvedValue(updatedPricing);

    const result = await service.updatePricing('car-1', { dailyRate: 180, depositAmount: 250 });

    expect(pricingRepository.update).toHaveBeenCalledWith('car-1', { dailyRate: 180, depositAmount: 250 });
    expect(result).toBe(updatedPricing);
  });
});
