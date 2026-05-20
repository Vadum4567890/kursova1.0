import { RentalService } from './RentalService';
import {
  RentalLifecycleState,
  RentalOwnerApprovalStatus,
  RentalStatus,
} from '../entities/Rental.entity';
import { RentalResolutionType } from '../entities/RentalResolution.entity';

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
      findAll: jest.fn().mockResolvedValue([]),
      findActive: jest.fn(),
      update: jest.fn(),
    };
    const rentalResolutionRepository = {
      create: jest.fn().mockResolvedValue({ id: 'resolution-1' }),
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
    (service as any).rentalResolutionRepository = rentalResolutionRepository;
    (service as any).carServiceClient = carServiceClient;
    (service as any).userServiceClient = userServiceClient;

    return { service, rentalRepository, rentalResolutionRepository, carServiceClient, userServiceClient };
  }

  it('creates rental with calculated totals and marks car rented', async () => {
    const { service, rentalRepository, carServiceClient, userServiceClient } = createService();
    const createdRental = createRental({
      status: RentalStatus.PENDING,
      ownerApprovalStatus: RentalOwnerApprovalStatus.APPROVED,
      lifecycleState: RentalLifecycleState.AWAITING_PICKUP,
      totalCost: 200,
      ownerUserId: 'owner-1',
    });

    carServiceClient.getCarForRental.mockResolvedValue({
      car: { id: 'car-1', ownerId: 'owner-1', instantBook: true },
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
        totalCost: 300,
        status: RentalStatus.PENDING,
      })
    );
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
        totalCost: 300,
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

  it('records an admin activation resolution with lifecycle audit data', async () => {
    const { service, rentalRepository, rentalResolutionRepository, carServiceClient, userServiceClient } =
      createService();
    const pendingRental = createRental({
      status: RentalStatus.PENDING,
      ownerApprovalStatus: RentalOwnerApprovalStatus.APPROVED,
      lifecycleState: RentalLifecycleState.AWAITING_PICKUP,
      ownerUserId: 'owner-1',
    });
    const activatedRental = {
      ...pendingRental,
      status: RentalStatus.ACTIVE,
      lifecycleState: RentalLifecycleState.ACTIVE,
      pickupConfirmedByOwnerAt: new Date('2099-05-10T09:00:00.000Z'),
      pickupConfirmedByRenterAt: new Date('2099-05-10T09:00:00.000Z'),
    };

    rentalRepository.findById.mockResolvedValue(pendingRental);
    rentalRepository.update.mockResolvedValue(activatedRental);
    carServiceClient.getCarById.mockResolvedValue({
      id: 'car-1',
      ownerId: 'owner-1',
      make: 'BMW',
      model: 'X5',
      year: 2023,
    });
    userServiceClient.getUserById.mockResolvedValue({ id: 'user-1', email: 'renter@example.com' });

    await service.resolveLifecycleByAdmin('rental-1', 'admin-1', 'admin', 'activate', {
      note: 'Both sides confirmed pickup by phone',
    });

    expect(rentalRepository.update).toHaveBeenCalledWith(
      'rental-1',
      expect.objectContaining({
        status: RentalStatus.ACTIVE,
        lifecycleState: RentalLifecycleState.ACTIVE,
        adminResolvedByUserId: 'admin-1',
        adminResolutionNote: 'Both sides confirmed pickup by phone',
      })
    );
    expect(carServiceClient.updateCarStatus).toHaveBeenCalledWith('car-1', 'rented');
    expect(rentalResolutionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rentalId: 'rental-1',
        actorUserId: 'admin-1',
        actorRole: 'admin',
        action: 'activate',
        resolutionType: RentalResolutionType.ADMIN_ACTIVATED,
        previousStatus: RentalStatus.PENDING,
        nextStatus: RentalStatus.ACTIVE,
        previousLifecycleState: RentalLifecycleState.AWAITING_PICKUP,
        nextLifecycleState: RentalLifecycleState.ACTIVE,
        note: 'Both sides confirmed pickup by phone',
      })
    );
  });

  it('marks no-show with penalty, refund amount, and an audit record', async () => {
    const { service, rentalRepository, rentalResolutionRepository, carServiceClient, userServiceClient } =
      createService();
    const pendingRental = createRental({
      status: RentalStatus.PENDING,
      ownerApprovalStatus: RentalOwnerApprovalStatus.APPROVED,
      lifecycleState: RentalLifecycleState.AWAITING_PICKUP,
      ownerUserId: 'owner-1',
      depositAmount: 500,
      totalCost: 900,
    });
    const noShowRental = {
      ...pendingRental,
      status: RentalStatus.CANCELLED,
      lifecycleState: RentalLifecycleState.NO_SHOW,
      actualEndDate: new Date('2099-05-10T09:00:00.000Z'),
      totalCost: 0,
      penaltyAmount: 300,
    };

    rentalRepository.findById.mockResolvedValue(pendingRental);
    rentalRepository.update.mockResolvedValue(noShowRental);
    carServiceClient.getCarById.mockResolvedValue({
      id: 'car-1',
      ownerId: 'owner-1',
      make: 'BMW',
      model: 'X5',
      year: 2023,
    });
    userServiceClient.getUserById.mockResolvedValue({ id: 'user-1', email: 'renter@example.com' });

    await service.resolveLifecycleByAdmin('rental-1', 'manager-1', 'manager', 'mark_no_show', {
      note: 'Renter did not arrive during the agreed pickup window',
      resolutionType: RentalResolutionType.RENTER_NO_SHOW,
      penaltyAmount: 300,
      depositRefundAmount: 200,
    });

    expect(rentalRepository.update).toHaveBeenCalledWith(
      'rental-1',
      expect.objectContaining({
        status: RentalStatus.CANCELLED,
        lifecycleState: RentalLifecycleState.NO_SHOW,
        totalCost: 0,
        penaltyAmount: 300,
      })
    );
    expect(carServiceClient.updateCarStatus).toHaveBeenCalledWith('car-1', 'active');
    expect(rentalResolutionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'manager',
        action: 'mark_no_show',
        resolutionType: RentalResolutionType.RENTER_NO_SHOW,
        penaltyAmount: 300,
        depositRefundAmount: 200,
        previousStatus: RentalStatus.PENDING,
        nextStatus: RentalStatus.CANCELLED,
        nextLifecycleState: RentalLifecycleState.NO_SHOW,
      })
    );
  });
});
