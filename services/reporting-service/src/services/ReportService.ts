import { Repository } from 'typeorm';
import { Rental, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';

export class ReportService {
  private rentalRepository: Repository<Rental>;

  constructor() {
    this.rentalRepository = AppDataSource.getRepository(Rental);
  }

  async generateFinancialReport(startDate?: Date, endDate?: Date): Promise<any> {
    const rentals = await this.rentalRepository.find();

    let filtered = rentals;
    if (startDate && endDate) {
      filtered = rentals.filter((r) => {
        const s = new Date(r.startDate);
        return s >= startDate && s <= endDate;
      });
    }

    const completedRentals = filtered.filter((r) => r.status === RentalStatus.COMPLETED);
    const activeRentals = filtered.filter((r) => r.status === RentalStatus.ACTIVE);
    const cancelledRentals = filtered.filter((r) => r.status === RentalStatus.CANCELLED);

    const totalRevenue = completedRentals.reduce(
      (sum, r) => sum + Number(r.totalCost) + Number(r.penaltyAmount),
      0
    );

    const expectedRevenue = activeRentals.reduce((sum, r) => sum + Number(r.totalCost), 0);

    const totalPenalties = completedRentals.reduce(
      (sum, r) => sum + Number(r.penaltyAmount),
      0
    );

    const totalDeposits = filtered.reduce((sum, r) => sum + Number(r.depositAmount), 0);

    const completedNetRevenue = completedRentals.reduce((sum, r) => {
      const cost = Number(r.totalCost);
      const penalty = Number(r.penaltyAmount);
      const deposit = Number(r.depositAmount);
      const depositToReturn = Math.max(0, deposit - penalty);
      return sum + (cost + penalty); // same simplification as monolith
    }, 0);

    const cancelledNetRevenue = cancelledRentals.reduce((sum, r) => {
      const cost = Number(r.totalCost);
      const penalty = Number(r.penaltyAmount);
      const deposit = Number(r.depositAmount);
      const depositToReturn = Math.max(0, deposit - penalty);
      const calculatedRevenue = cost + penalty - depositToReturn;
      return sum + Math.max(0, calculatedRevenue);
    }, 0);

    const netRevenue = completedNetRevenue + cancelledNetRevenue;

    const debugInfo = {
      completedRentalsCount: completedRentals.length,
      activeRentalsCount: activeRentals.length,
      cancelledRentalsCount: cancelledRentals.length,
      totalRevenueFromCompleted: totalRevenue,
      expectedRevenueFromActive: expectedRevenue,
      depositsToReturnFromCompleted: 0,
      cancelledDepositsToReturn: 0,
      completedNetRevenue,
      cancelledNetRevenue,
      calculation: {
        completed: completedRentals.map((r) => ({
          id: 0,
          cost: Number(r.totalCost),
          penalty: Number(r.penaltyAmount),
          deposit: Number(r.depositAmount),
          depositToReturn: 0,
          net: Number(r.totalCost) + Number(r.penaltyAmount),
        })),
      },
    };

    const now = new Date();
    return {
      totalRevenue: totalRevenue + expectedRevenue,
      totalPenalties,
      totalDeposits,
      netRevenue,
      debug: debugInfo,
      period: {
        startDate: (startDate || new Date(0)).toISOString(),
        endDate: (endDate || now).toISOString(),
      },
      rentals: {
        total: filtered.length,
        completed: completedRentals.length,
        active: activeRentals.length,
        cancelled: cancelledRentals.length,
      },
    };
  }

  async generateOccupancyReport(): Promise<any> {
    return {
      totalCars: 0,
      availableCars: 0,
      rentedCars: 0,
      maintenanceCars: 0,
      occupancyRate: 0,
      byType: {
        economy: { total: 0, available: 0, rented: 0 },
        business: { total: 0, available: 0, rented: 0 },
        premium: { total: 0, available: 0, rented: 0 },
      },
    };
  }

  async generateAvailabilityReport(): Promise<any> {
    return {
      availableCars: 0,
      unavailableCars: 0,
      maintenanceCars: 0,
      cars: [],
    };
  }

  async generateCarReport(startDate?: Date, endDate?: Date): Promise<any> {
    const now = new Date();
    return {
      period: {
        startDate: (startDate || new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: (endDate || now).toISOString(),
      },
      summary: {
        totalCars: 0,
        totalRevenue: 0,
        totalNetRevenue: 0,
        totalPenalties: 0,
        averageOccupancyRate: 0,
      },
      cars: [],
    };
  }
}

