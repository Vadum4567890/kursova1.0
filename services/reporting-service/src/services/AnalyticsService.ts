import { Repository } from 'typeorm';
import { Rental, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';
import { fetchCarBrandModel } from '../clients/carServiceClient';
import { fetchUserDisplayName } from '../clients/userServiceClient';

function toNumber(value: unknown): number {
  return Number(value || 0);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class AnalyticsService {
  private rentalRepository: Repository<Rental>;

  constructor() {
    this.rentalRepository = AppDataSource.getRepository(Rental);
  }

  private async getRentalsInRange(startDate?: Date, endDate?: Date): Promise<Rental[]> {
    const rentals = await this.rentalRepository.find({ order: { startDate: 'ASC' } });
    const start = startDate || new Date(2000, 0, 1);
    const end = endDate || new Date();
    return rentals.filter((rental) => rental.startDate >= start && rental.startDate <= end);
  }

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const filtered = await this.getRentalsInRange(startDate, endDate);
    const activeRentals = filtered.filter((rental) => rental.status === RentalStatus.ACTIVE);
    const completedRentals = filtered.filter((rental) => rental.status === RentalStatus.COMPLETED);
    const distinctCars = new Set(filtered.map((rental) => rental.carId));
    const activeCars = new Set(activeRentals.map((rental) => rental.carId));

    const totalRevenue = completedRentals.reduce(
      (sum, rental) => sum + toNumber(rental.totalCost) + toNumber(rental.penaltyAmount),
      0
    );
    const totalPenalties = completedRentals.reduce((sum, rental) => sum + toNumber(rental.penaltyAmount), 0);
    const totalDeposits = filtered.reduce((sum, rental) => sum + toNumber(rental.depositAmount), 0);
    const totalCars = distinctCars.size;
    const rentedCars = activeCars.size;

    return {
      totalCars,
      availableCars: Math.max(0, totalCars - rentedCars),
      rentedCars,
      maintenanceCars: 0,
      totalClients: new Set(filtered.map((rental) => rental.renterUserId)).size,
      activeRentals: activeRentals.length,
      completedRentals: completedRentals.length,
      totalRevenue: roundCurrency(totalRevenue),
      totalPenalties: roundCurrency(totalPenalties),
      totalDeposits: roundCurrency(totalDeposits),
      netRevenue: roundCurrency(totalRevenue),
      averageRentalDuration: await this.getAverageRentalDuration(),
      occupancyRate: totalCars > 0 ? roundCurrency((rentedCars / totalCars) * 100) : 0,
      averageRevenuePerRental:
        completedRentals.length > 0 ? roundCurrency(totalRevenue / completedRentals.length) : 0,
    };
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<any> {
    const inRange = await this.getRentalsInRange(startDate, endDate);
    const completed = inRange.filter((rental) => rental.status === RentalStatus.COMPLETED);

    const revenueByDay = new Map<string, number>();
    const penaltiesByDay = new Map<string, number>();

    completed.forEach((rental) => {
      const date = rental.actualEndDate || rental.expectedEndDate;
      const key = date.toISOString().split('T')[0];
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + toNumber(rental.totalCost));
      penaltiesByDay.set(key, (penaltiesByDay.get(key) || 0) + toNumber(rental.penaltyAmount));
    });

    return {
      totalRevenue: roundCurrency(completed.reduce((sum, rental) => sum + toNumber(rental.totalCost), 0)),
      totalPenalties: roundCurrency(completed.reduce((sum, rental) => sum + toNumber(rental.penaltyAmount), 0)),
      recognizedRevenue: roundCurrency(
        completed.reduce((sum, rental) => sum + toNumber(rental.totalCost) + toNumber(rental.penaltyAmount), 0)
      ),
      revenueByDay: Array.from(revenueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({
          date,
          amount: roundCurrency(amount),
          penalties: roundCurrency(penaltiesByDay.get(date) || 0),
        })),
      revenueByType: [
        {
          type: 'rentals',
          amount: roundCurrency(completed.reduce((sum, rental) => sum + toNumber(rental.totalCost), 0)),
        },
        {
          type: 'penalties',
          amount: roundCurrency(completed.reduce((sum, rental) => sum + toNumber(rental.penaltyAmount), 0)),
        },
      ],
      period: {
        startDate: (startDate || new Date(2000, 0, 1)).toISOString(),
        endDate: (endDate || new Date()).toISOString(),
      },
    };
  }

  async getPopularCars(limit: number = 10): Promise<any[]> {
    const rentals = await this.rentalRepository.find();
    const map = new Map<string, { rentalCount: number; totalRevenue: number }>();

    rentals.forEach((rental) => {
      const current = map.get(rental.carId) || { rentalCount: 0, totalRevenue: 0 };
      current.rentalCount += 1;
      // Лише базова вартість прокату; штрафи не є «дохідом» у цьому віджеті
      current.totalRevenue += toNumber(rental.totalCost);
      map.set(rental.carId, current);
    });

    const sorted = Array.from(map.entries())
      .map(([carId, stats]) => ({ carId, ...stats }))
      .sort((a, b) => b.rentalCount - a.rentalCount || b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return Promise.all(
      sorted.map(async ({ carId, rentalCount, totalRevenue }) => {
        const meta = await fetchCarBrandModel(carId);
        return {
          car: {
            id: carId,
            brand: meta?.brand ?? 'Невідомо',
            model: meta?.model ?? carId.slice(0, 8),
          },
          rentalCount,
          totalRevenue: roundCurrency(totalRevenue),
        };
      })
    );
  }

  async getTopClients(limit: number = 10, startDate?: Date, endDate?: Date): Promise<any[]> {
    const rentals = await this.getRentalsInRange(startDate, endDate);
    const map = new Map<
      string,
      {
        rentalCount: number;
        totalCost: number;
        totalPenalties: number;
        totalDeposits: number;
        totalToReturn: number;
      }
    >();

    rentals.forEach((rental) => {
      const current = map.get(rental.renterUserId) || {
        rentalCount: 0,
        totalCost: 0,
        totalPenalties: 0,
        totalDeposits: 0,
        totalToReturn: 0,
      };

      const totalCost = toNumber(rental.totalCost);
      const totalPenalties = toNumber(rental.penaltyAmount);
      const totalDeposits = toNumber(rental.depositAmount);
      const totalToReturn =
        rental.status === RentalStatus.ACTIVE ? totalDeposits : Math.max(0, totalDeposits - totalPenalties);

      current.rentalCount += 1;
      current.totalCost += totalCost;
      current.totalPenalties += totalPenalties;
      current.totalDeposits += totalDeposits;
      current.totalToReturn += totalToReturn;
      map.set(rental.renterUserId, current);
    });

    const rows = Array.from(map.entries())
      .map(([renterUserId, stats]) => {
        const totalReceived = stats.totalCost + stats.totalPenalties;
        const netRevenue = roundCurrency(totalReceived - stats.totalToReturn);
        return { renterUserId, stats, totalReceived, netRevenue };
      })
      .sort((a, b) => b.netRevenue - a.netRevenue)
      .slice(0, limit);

    return Promise.all(
      rows.map(async ({ renterUserId, stats, totalReceived }) => {
        const resolvedName = await fetchUserDisplayName(renterUserId);
        return {
          client: {
            id: renterUserId,
            fullName: resolvedName || 'Орендар',
            phone: '',
          },
          totalSpent: roundCurrency(totalReceived),
          totalReceived: roundCurrency(totalReceived),
          totalCost: roundCurrency(stats.totalCost),
          totalPenalties: roundCurrency(stats.totalPenalties),
          totalDeposits: roundCurrency(stats.totalDeposits),
          totalToReturn: roundCurrency(stats.totalToReturn),
          netRevenue: roundCurrency(totalReceived - stats.totalToReturn),
          rentalCount: stats.rentalCount,
        };
      })
    );
  }

  async calculateOccupancyRate(): Promise<number> {
    const rentals = await this.rentalRepository.find();
    const distinctCars = new Set(rentals.map((rental) => rental.carId));
    const activeCars = new Set(
      rentals.filter((rental) => rental.status === RentalStatus.ACTIVE).map((rental) => rental.carId)
    );

    return distinctCars.size > 0 ? roundCurrency((activeCars.size / distinctCars.size) * 100) : 0;
  }

  async getRevenueForecast(): Promise<any> {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthStats = await this.getRevenueStats(lastMonthStart, lastMonthEnd);
    const currentMonthStats = await this.getRevenueStats(currentMonthStart, now);
    const trend = lastMonthStats.totalRevenue > 0
      ? roundCurrency(((currentMonthStats.totalRevenue - lastMonthStats.totalRevenue) / lastMonthStats.totalRevenue) * 100)
      : 0;

    return {
      forecastRevenue: roundCurrency(currentMonthStats.totalRevenue || lastMonthStats.totalRevenue),
      baselineRevenue: roundCurrency(lastMonthStats.totalRevenue),
      currentMonthRevenue: roundCurrency(currentMonthStats.totalRevenue),
      trendPercent: trend,
    };
  }

  private async getAverageRentalDuration(): Promise<number> {
    const completedRentals = await this.rentalRepository.find({
      where: { status: RentalStatus.COMPLETED },
    });
    if (completedRentals.length === 0) return 0;

    const totalDays = completedRentals.reduce((sum, rental) => {
      const end = rental.actualEndDate || rental.expectedEndDate;
      const days = Math.ceil((end.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(1, days);
    }, 0);

    return roundCurrency(totalDays / completedRentals.length);
  }
}
