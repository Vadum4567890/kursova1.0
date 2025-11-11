import { CarRepository } from '../repositories/CarRepository';
import { ClientRepository } from '../repositories/ClientRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { PenaltyRepository } from '../repositories/PenaltyRepository';
import { RentalStatus } from '../models/Rental.entity';
import { CarStatus } from '../models/Car.entity';

/**
 * Service for analytics and statistics
 * Provides data for admin dashboard
 */
export class AnalyticsService {
  private carRepository: CarRepository;
  private clientRepository: ClientRepository;
  private rentalRepository: RentalRepository;
  private penaltyRepository: PenaltyRepository;

  constructor() {
    this.carRepository = new CarRepository();
    this.clientRepository = new ClientRepository();
    this.rentalRepository = new RentalRepository();
    this.penaltyRepository = new PenaltyRepository();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || now;

    const [
      totalCars,
      availableCars,
      activeRentals,
      allRentals,
      totalRevenue,
      totalPenalties,
      totalDeposits,
    ] = await Promise.all([
      this.carRepository.findAll(),
      this.carRepository.findAvailableCars(),
      this.rentalRepository.findActiveRentals(),
      this.rentalRepository.findAll(),
      this.getTotalRevenue(start, end),
      this.getTotalPenalties(start, end),
      this.getTotalDeposits(),
    ]);

    const completedRentals = allRentals.filter(r => r.status === RentalStatus.COMPLETED);

    const totalClients = await this.clientRepository.findAll();

    // Calculate average rental duration
    const avgRentalDuration = await this.getAverageRentalDuration();

    // Calculate occupancy rate
    const occupancyRate = await this.calculateOccupancyRate();

    return {
      overview: {
        totalCars: totalCars.length,
        availableCars: availableCars.length,
        rentedCars: totalCars.filter(c => c.status === CarStatus.RENTED).length,
        maintenanceCars: totalCars.filter(c => c.status === CarStatus.MAINTENANCE).length,
        totalClients: totalClients.length,
        activeRentals: activeRentals.length,
        completedRentals: completedRentals.length,
      },
      financial: {
        totalRevenue: totalRevenue,
        totalPenalties: totalPenalties,
        totalDeposits: totalDeposits,
        netRevenue: totalRevenue + totalPenalties,
      },
      metrics: {
        averageRentalDuration: avgRentalDuration,
        occupancyRate: occupancyRate,
        averageRevenuePerRental: completedRentals.length > 0 
          ? totalRevenue / completedRentals.length 
          : 0,
      },
      period: {
        startDate: start,
        endDate: end,
      },
    };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<any> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || now;

    const rentals = await this.rentalRepository.findByDateRange(start, end);
    const completedRentals = rentals.filter(r => r.status === RentalStatus.COMPLETED);

    // Revenue by day
    const revenueByDay: { [key: string]: number } = {};
    completedRentals.forEach(rental => {
      const date = rental.actualEndDate || rental.expectedEndDate;
      const dateKey = date.toISOString().split('T')[0];
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + Number(rental.totalCost);
    });

    // Revenue by car type
    const revenueByType: { [key: string]: number } = {};
    completedRentals.forEach(rental => {
      const type = rental.car.type;
      revenueByType[type] = (revenueByType[type] || 0) + Number(rental.totalCost);
    });

    return {
      totalRevenue: await this.getTotalRevenue(start, end),
      revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount,
      })),
      revenueByType: Object.entries(revenueByType).map(([type, amount]) => ({
        type,
        amount,
      })),
      period: {
        startDate: start,
        endDate: end,
      },
    };
  }

  /**
   * Get popular cars (most rented)
   */
  async getPopularCars(limit: number = 10): Promise<any[]> {
    const rentals = await this.rentalRepository.findAll();
    const carRentalCount: { [key: number]: { car: any; count: number; revenue: number } } = {};

    rentals.forEach(rental => {
      const carId = rental.car.id;
      if (!carRentalCount[carId]) {
        carRentalCount[carId] = {
          car: rental.car,
          count: 0,
          revenue: 0,
        };
      }
      carRentalCount[carId].count++;
      if (rental.status === RentalStatus.COMPLETED) {
        carRentalCount[carId].revenue += Number(rental.totalCost);
      }
    });

    return Object.values(carRentalCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => ({
        car: {
          id: item.car.id,
          brand: item.car.brand,
          model: item.car.model,
          type: item.car.type,
        },
        rentalCount: item.count,
        totalRevenue: item.revenue,
      }));
  }

  /**
   * Get top clients (most active)
   */
  async getTopClients(limit: number = 10): Promise<any[]> {
    const rentals = await this.rentalRepository.findAll();
    const clientRentalCount: { [key: number]: { client: any; count: number; totalSpent: number } } = {};

    rentals.forEach(rental => {
      const clientId = rental.client.id;
      if (!clientRentalCount[clientId]) {
        clientRentalCount[clientId] = {
          client: rental.client,
          count: 0,
          totalSpent: 0,
        };
      }
      clientRentalCount[clientId].count++;
      if (rental.status === RentalStatus.COMPLETED) {
        clientRentalCount[clientId].totalSpent += Number(rental.totalCost) + Number(rental.penaltyAmount);
      }
    });

    return Object.values(clientRentalCount)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map(item => ({
        client: {
          id: item.client.id,
          fullName: item.client.fullName,
          phone: item.client.phone,
        },
        rentalCount: item.count,
        totalSpent: item.totalSpent,
      }));
  }

  /**
   * Calculate occupancy rate
   */
  async calculateOccupancyRate(): Promise<number> {
    const cars = await this.carRepository.findAll();
    const activeRentals = await this.rentalRepository.findActiveRentals();
    
    if (cars.length === 0) return 0;
    
    return (activeRentals.length / cars.length) * 100;
  }

  /**
   * Get total revenue for period
   */
  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const rentals = await this.rentalRepository.findByDateRange(startDate, endDate);
    return rentals
      .filter(r => r.status === RentalStatus.COMPLETED)
      .reduce((sum, rental) => sum + Number(rental.totalCost), 0);
  }

  /**
   * Get total penalties for period
   */
  private async getTotalPenalties(startDate: Date, endDate: Date): Promise<number> {
    const rentals = await this.rentalRepository.findByDateRange(startDate, endDate);
    return rentals
      .filter(r => r.status === RentalStatus.COMPLETED)
      .reduce((sum, rental) => sum + Number(rental.penaltyAmount), 0);
  }

  /**
   * Get total deposits (active rentals)
   */
  private async getTotalDeposits(): Promise<number> {
    const activeRentals = await this.rentalRepository.findActiveRentals();
    return activeRentals.reduce((sum, rental) => sum + Number(rental.depositAmount), 0);
  }

  /**
   * Get average rental duration in days
   */
  private async getAverageRentalDuration(): Promise<number> {
    const allRentals = await this.rentalRepository.findAll();
    const completedRentals = allRentals.filter(r => r.status === RentalStatus.COMPLETED);
    
    if (completedRentals.length === 0) return 0;

    const totalDays = completedRentals.reduce((sum, rental) => {
      const endDate = rental.actualEndDate || rental.expectedEndDate;
      const days = Math.ceil(
        (endDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / completedRentals.length;
  }

  /**
   * Get revenue forecast for next month
   */
  async getRevenueForecast(): Promise<number> {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthRevenue = await this.getTotalRevenue(lastMonthStart, lastMonthEnd);
    
    // Simple forecast: assume same revenue as last month
    // In production, you could use more sophisticated forecasting
    return lastMonthRevenue;
  }
}

