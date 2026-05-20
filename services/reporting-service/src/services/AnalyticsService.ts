import { Repository } from 'typeorm';
import { Rental, RentalLifecycleState, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';
import { fetchCarBrandModel, fetchCarsCatalog } from '../clients/carServiceClient';
import { fetchUserDisplayName } from '../clients/userServiceClient';

function toNumber(value: unknown): number {
  return Number(value || 0);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getSystemCommissionRate(): number {
  const raw = Number(process.env.SYSTEM_COMMISSION_RATE ?? 0.05);
  if (!Number.isFinite(raw) || raw < 0) return 0.05;
  return raw;
}

function isDisputedOrRiskyLifecycle(state?: RentalLifecycleState | null): boolean {
  return [
    RentalLifecycleState.PICKUP_PARTIALLY_CONFIRMED,
    RentalLifecycleState.PICKUP_DISPUTED,
    RentalLifecycleState.NO_SHOW,
    RentalLifecycleState.RETURN_DUE,
    RentalLifecycleState.RETURN_PARTIALLY_CONFIRMED,
    RentalLifecycleState.RETURN_DISPUTED,
  ].includes(state as RentalLifecycleState);
}

export class AnalyticsService {
  private rentalRepository: Repository<Rental>;
  private readonly systemCommissionRate: number;

  constructor() {
    this.rentalRepository = AppDataSource.getRepository(Rental);
    this.systemCommissionRate = getSystemCommissionRate();
  }

  private systemCommissionFromRentalCost(rentalCost: number): number {
    return roundCurrency(Math.max(0, rentalCost) * this.systemCommissionRate);
  }

  private async getRentalsInRange(startDate?: Date, endDate?: Date): Promise<Rental[]> {
    const rentals = await this.rentalRepository.find({ order: { startDate: 'ASC' } });
    const start = startDate ? new Date(startDate) : new Date(2000, 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return rentals.filter((rental) => rental.startDate >= start && rental.startDate <= end);
  }

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const filtered = await this.getRentalsInRange(startDate, endDate);
    const activeRentals = filtered.filter((rental) => rental.status === RentalStatus.ACTIVE);
    const completedRentals = filtered.filter((rental) => rental.status === RentalStatus.COMPLETED);
    const pendingRentals = filtered.filter((rental) => rental.status === RentalStatus.PENDING);
    const openRentals = [...activeRentals, ...pendingRentals];
    const cars = await fetchCarsCatalog();
    const activeCars = new Set(activeRentals.map((rental) => rental.carId));

    const totalRentalRevenue = completedRentals.reduce((sum, rental) => sum + toNumber(rental.totalCost), 0);
    const totalPenalties = completedRentals.reduce((sum, rental) => sum + toNumber(rental.penaltyAmount), 0);
    const systemRevenue = completedRentals.reduce(
      (sum, rental) => sum + this.systemCommissionFromRentalCost(toNumber(rental.totalCost)),
      0
    );
    const landlordRevenue = totalRentalRevenue - systemRevenue + totalPenalties;
    const totalRevenue = totalRentalRevenue + totalPenalties;
    const projectedRevenue = openRentals
      .filter((rental) => !isDisputedOrRiskyLifecycle(rental.lifecycleState))
      .reduce((sum, rental) => sum + toNumber(rental.totalCost), 0);
    const disputedRevenue = openRentals
      .filter((rental) => isDisputedOrRiskyLifecycle(rental.lifecycleState))
      .reduce((sum, rental) => sum + toNumber(rental.totalCost) + toNumber(rental.penaltyAmount), 0);
    const refundedDeposits = filtered
      .filter((rental) => rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.CANCELLED)
      .reduce(
        (sum, rental) => sum + Math.max(0, toNumber(rental.depositAmount) - toNumber(rental.penaltyAmount)),
        0
      );
    const totalDeposits = filtered.reduce((sum, rental) => sum + toNumber(rental.depositAmount), 0);
    const totalCars = cars.length;
    const rentedCars = activeCars.size;

    return {
      totalCars,
      availableCars: Math.max(0, totalCars - rentedCars),
      rentedCars,
      maintenanceCars: 0,
      totalClients: new Set(filtered.map((rental) => rental.renterUserId)).size,
      activeRentals: activeRentals.length,
      completedRentals: completedRentals.length,
      systemCommissionRate: this.systemCommissionRate,
      totalRentalRevenue: roundCurrency(totalRentalRevenue),
      systemRevenue: roundCurrency(systemRevenue),
      landlordRevenue: roundCurrency(landlordRevenue),
      totalRevenue: roundCurrency(totalRevenue),
      recognizedRevenue: roundCurrency(totalRevenue),
      projectedRevenue: roundCurrency(projectedRevenue),
      disputedRevenue: roundCurrency(disputedRevenue),
      totalPenalties: roundCurrency(totalPenalties),
      totalDeposits: roundCurrency(totalDeposits),
      refundedDeposits: roundCurrency(refundedDeposits),
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
    const open = inRange.filter(
      (rental) => rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.PENDING
    );

    const revenueByDay = new Map<string, number>();
    const systemRevenueByDay = new Map<string, number>();
    const landlordRevenueByDay = new Map<string, number>();
    const penaltiesByDay = new Map<string, number>();

    completed.forEach((rental) => {
      const date = rental.actualEndDate || rental.expectedEndDate;
      const key = date.toISOString().split('T')[0];
      const rentalRevenue = toNumber(rental.totalCost);
      const penalties = toNumber(rental.penaltyAmount);
      const systemRevenue = this.systemCommissionFromRentalCost(rentalRevenue);
      const landlordRevenue = rentalRevenue - systemRevenue + penalties;
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + rentalRevenue);
      penaltiesByDay.set(key, (penaltiesByDay.get(key) || 0) + penalties);
      systemRevenueByDay.set(key, (systemRevenueByDay.get(key) || 0) + systemRevenue);
      landlordRevenueByDay.set(key, (landlordRevenueByDay.get(key) || 0) + landlordRevenue);
    });

    const totalRentalRevenue = completed.reduce((sum, rental) => sum + toNumber(rental.totalCost), 0);
    const totalPenalties = completed.reduce((sum, rental) => sum + toNumber(rental.penaltyAmount), 0);
    const systemRevenue = completed.reduce(
      (sum, rental) => sum + this.systemCommissionFromRentalCost(toNumber(rental.totalCost)),
      0
    );
    const landlordRevenue = totalRentalRevenue - systemRevenue + totalPenalties;
    const projectedRevenue = open
      .filter((rental) => !isDisputedOrRiskyLifecycle(rental.lifecycleState))
      .reduce((sum, rental) => sum + toNumber(rental.totalCost), 0);
    const disputedRevenue = open
      .filter((rental) => isDisputedOrRiskyLifecycle(rental.lifecycleState))
      .reduce((sum, rental) => sum + toNumber(rental.totalCost) + toNumber(rental.penaltyAmount), 0);

    return {
      systemCommissionRate: this.systemCommissionRate,
      totalRevenue: roundCurrency(totalRentalRevenue + totalPenalties + projectedRevenue + disputedRevenue),
      totalRentalRevenue: roundCurrency(totalRentalRevenue),
      totalPenalties: roundCurrency(totalPenalties),
      systemRevenue: roundCurrency(systemRevenue),
      landlordRevenue: roundCurrency(landlordRevenue),
      recognizedRevenue: roundCurrency(totalRentalRevenue + totalPenalties),
      projectedRevenue: roundCurrency(projectedRevenue),
      disputedRevenue: roundCurrency(disputedRevenue),
      revenueByDay: Array.from(revenueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({
          date,
          amount: roundCurrency(amount),
          penalties: roundCurrency(penaltiesByDay.get(date) || 0),
          systemRevenue: roundCurrency(systemRevenueByDay.get(date) || 0),
          landlordRevenue: roundCurrency(landlordRevenueByDay.get(date) || 0),
        })),
      revenueByType: [
        {
          type: 'rentals',
          amount: roundCurrency(totalRentalRevenue),
        },
        {
          type: 'penalties',
          amount: roundCurrency(totalPenalties),
        },
        {
          type: 'system_commission',
          amount: roundCurrency(systemRevenue),
        },
        {
          type: 'landlord_revenue',
          amount: roundCurrency(landlordRevenue),
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
        const netRevenue = roundCurrency(totalReceived);
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
          netRevenue: roundCurrency(totalReceived),
          rentalCount: stats.rentalCount,
        };
      })
    );
  }

  async calculateOccupancyRate(): Promise<number> {
    const [rentals, cars] = await Promise.all([this.rentalRepository.find(), fetchCarsCatalog()]);
    const activeCars = new Set(
      rentals.filter((rental) => rental.status === RentalStatus.ACTIVE).map((rental) => rental.carId)
    );

    return cars.length > 0 ? roundCurrency((activeCars.size / cars.length) * 100) : 0;
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
