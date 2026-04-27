import { RentalService } from './RentalService';
import { RentalStatus } from '../entities/Rental.entity';

jest.mock('../kafka/producer', () => ({
  sendEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../ws/chatWebSocket', () => ({
  broadcastChatTopic: jest.fn(),
  broadcastToUser: jest.fn(),
}));

function createRental(overrides: Partial<any> = {}) {
  return {
    id: 'rental-1',
    carId: 'car-1',
    renterUserId: 'user-1',
    startDate: new Date('2099-05-10T00:00:00.000Z'),
    expectedEndDate: new Date('2099-05-12T00:00:00.000Z'),
    actualEndDate: null,
    depositAmount: 200,
    totalCost: 300,
    penaltyAmount: 0,
    status: RentalStatus.ACTIVE,
    penalties: [],
    ...overrides,
  };
}

describe('RentalService', () => {
  function createService() {
    const service = new RentalService();
    const rentalRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCarId: jest.fn(),
      findByRenterId: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      update: jest.fn(),
    };
    const carServiceClient = {
      getCarForRental: jest.fn(),
      getCarById: jest.fn(),
      updateCarStatus: jest.fn().mockResolvedValue(true),
    };
    const userServiceClient = {
      validateRenter: jest.fn(),
      getUserById: jest.fn(),
    };

    (service as any).rentalRepository = rentalRepository;
    (service as any).carServiceClient = carServiceClient;
    (service as any).userServiceClient = userServiceClient;

    return { service, rentalRepository, carServiceClient, userServiceClient };
  }

  it('creates rental with calculated totals and marks car rented', async () => {
    const { service, rentalRepository, carServiceClient, userServiceClient } = createService();
    const createdRental = createRental();

    carServiceClient.getCarForRental.mockResolvedValue({
      car: { id: 'car-1', ownerId: 'owner-1' },
      dailyRate: 100,
      depositAmount: 200,
    });
    carServiceClient.getCarById.mockResolvedValue({
      id: 'car-1',
      ownerId: 'owner-1',
      make: 'BMW',
      model: 'X5',
      year: 2023,
      status: 'active',
    });
    userServiceClient.validateRenter.mockResolvedValue(true);
    userServiceClient.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });
    rentalRepository.findByCarId.mockResolvedValue([]);
    rentalRepository.create.mockResolvedValue(createdRental);

    const result = await service.createRental(
      'car-1',
      'user-1',
      new Date('2099-05-10T00:00:00.000Z'),
      new Date('2099-05-12T00:00:00.000Z')
    );

    expect(rentalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        carId: 'car-1',
        renterUserId: 'user-1',
        depositAmount: 200,
        totalCost: 200,
        status: RentalStatus.PENDING,
      })
    );
    expect(carServiceClient.updateCarStatus).toHaveBeenCalledWith('car-1', 'rented');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'rental-1',
        carId: 'car-1',
        renterUserId: 'user-1',
        car: expect.objectContaining({ make: 'BMW', model: 'X5' }),
        renter: expect.objectContaining({ email: 'user@example.com' }),
      })
    );
  });

  it('rejects overlapping active rentals', async () => {
    const { service, rentalRepository, carServiceClient, userServiceClient } = createService();

    carServiceClient.getCarForRental.mockResolvedValue({
      car: { id: 'car-1', ownerId: 'owner-1' },
      dailyRate: 100,
      depositAmount: 200,
    });
    userServiceClient.validateRenter.mockResolvedValue(true);
    rentalRepository.findByCarId.mockResolvedValue([
      createRental({
        id: 'existing',
        startDate: new Date('2099-05-11T00:00:00.000Z'),
        expectedEndDate: new Date('2099-05-13T00:00:00.000Z'),
        status: RentalStatus.ACTIVE,
      }),
    ]);

    await expect(
      service.createRental(
        'car-1',
        'user-1',
        new Date('2099-05-10T00:00:00.000Z'),
        new Date('2099-05-12T00:00:00.000Z')
      )
    ).rejects.toMatchObject({
      message: 'Car is already booked for the selected dates',
      statusCode: 400,
    });
  });

  it('completes rental and restores car to active when no other active rentals remain', async () => {
    const { service, rentalRepository, carServiceClient } = createService();
    const activeRental = createRental({
      id: 'rental-1',
      startDate: new Date('2099-05-10T00:00:00.000Z'),
      expectedEndDate: new Date('2099-05-12T00:00:00.000Z'),
    });
    const completedRental = createRental({
      id: 'rental-1',
      status: RentalStatus.COMPLETED,
      actualEndDate: new Date('2099-05-12T00:00:00.000Z'),
      totalCost: 200,
    });

    rentalRepository.findById
      .mockResolvedValueOnce(activeRental)
      .mockResolvedValueOnce(completedRental);
    rentalRepository.update.mockResolvedValue(completedRental);
    rentalRepository.findByCarId.mockResolvedValue([completedRental]);
    carServiceClient.getCarForRental.mockResolvedValue({
      car: { id: 'car-1', ownerId: 'owner-1' },
      dailyRate: 100,
      depositAmount: 200,
    });
    carServiceClient.getCarById.mockResolvedValue({
      id: 'car-1',
      ownerId: 'owner-1',
      make: 'BMW',
      model: 'X5',
      year: 2023,
      status: 'active',
    });
    (service as any).userServiceClient.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const result = await service.completeRental('rental-1', new Date('2099-05-12T00:00:00.000Z'));

    expect(rentalRepository.update).toHaveBeenCalledWith(
      'rental-1',
      expect.objectContaining({
        status: RentalStatus.COMPLETED,
        penaltyAmount: 0,
        totalCost: 200,
      })
    );
    expect(carServiceClient.updateCarStatus).toHaveBeenCalledWith('car-1', 'active');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'rental-1',
        status: RentalStatus.COMPLETED,
        car: expect.objectContaining({ id: 'car-1' }),
      })
    );
  });
});
