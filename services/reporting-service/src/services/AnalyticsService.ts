import { Repository } from 'typeorm';
import { Rental, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';

export class AnalyticsService {
  private rentalRepository: Repository<Rental>;

  constructor() {
    this.rentalRepository = AppDataSource.getRepository(Rental);
  }

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const rentals = await this.rentalRepository.find();

    let filtered = rentals;
    if (startDate || endDate) {
      const start = startDate || new Date(2000, 0, 1);
      const end = endDate || new Date();
      filtered = rentals.filter((r) => {
        const s = new Date(r.startDate);
        return s >= start && s <= end;
      });
    }

    const activeRentals = filtered.filter((r) => r.status === RentalStatus.ACTIVE);
    const completedRentals = filtered.filter((r) => r.status === RentalStatus.COMPLETED);

    const totalRevenue = completedRentals.reduce(
      (sum, r) => sum + Number(r.totalCost) + Number(r.penaltyAmount),
      0
    );

    const totalPenalties = completedRentals.reduce(
      (sum, r) => sum + Number(r.penaltyAmount),
      0
    );

    const totalDeposits = filtered.reduce((sum, r) => sum + Number(r.depositAmount), 0);

    const avgDuration = await this.getAverageRentalDuration();

    return {
      totalCars: 0,
      availableCars: 0,
      rentedCars: 0,
      maintenanceCars: 0,
      totalClients: new Set(filtered.map((r) => r.renterUserId)).size,
      activeRentals: activeRentals.length,
      completedRentals: completedRentals.length,
      totalRevenue,
      totalPenalties,
      totalDeposits,
      netRevenue: totalRevenue,
      averageRentalDuration: avgDuration,
      occupancyRate: 0,
      averageRevenuePerRental: completedRentals.length > 0 ? totalRevenue / completedRentals.length : 0,
    };
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<any> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || now;

    const rentals = await this.rentalRepository.find();
    const inRange = rentals.filter((r) => {
      const d = new Date(r.startDate);
      return d >= start && d <= end;
    });
    const completed = inRange.filter((r) => r.status === RentalStatus.COMPLETED);

    const revenueByDay: { [key: string]: number } = {};
    completed.forEach((r) => {
      const date = r.actualEndDate || r.expectedEndDate;
      const key = date.toISOString().split('T')[0];
      revenueByDay[key] = (revenueByDay[key] || 0) + Number(r.totalCost);
    });

    return {
      totalRevenue: completed.reduce((sum, r) => sum + Number(r.totalCost), 0),
      revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
      revenueByType: [],
      period: {
        startDate: start,
        endDate: end,
      },
    };
  }

  async getPopularCars(_limit: number = 10): Promise<any[]> {
    return [];
  }

  async getTopClients(_limit: number = 10, _startDate?: Date, _endDate?: Date): Promise<any[]> {
    return [];
  }

  async calculateOccupancyRate(): Promise<number> {
    return 0;
  }

  async getRevenueForecast(): Promise<number> {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const stats = await this.getRevenueStats(lastMonthStart, lastMonthEnd);
    return stats.totalRevenue;
  }

  private async getAverageRentalDuration(): Promise<number> {
    const completedRentals = await this.rentalRepository.find({
      where: { status: RentalStatus.COMPLETED },
    });
    if (completedRentals.length === 0) return 0;

    const totalDays = completedRentals.reduce((sum, r) => {
      const end = r.actualEndDate || r.expectedEndDate;
      const days = Math.ceil((end.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalDays / completedRentals.length;
  }
}

