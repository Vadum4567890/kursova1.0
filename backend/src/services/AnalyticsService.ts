import { ICarRepository } from '../core/interfaces/ICarRepository';
import { IClientRepository } from '../core/interfaces/IClientRepository';
import { IRentalRepository } from '../core/interfaces/IRentalRepository';
import { IPenaltyRepository } from '../core/interfaces/IPenaltyRepository';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { CarStatus } from '../models/Car.entity';

/**
 * Service for analytics and statistics
 * Provides data for admin dashboard
 */
export class AnalyticsService {
  constructor(
    private carRepository: ICarRepository,
    private clientRepository: IClientRepository,
    private rentalRepository: IRentalRepository,
    private penaltyRepository: IPenaltyRepository
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const now = new Date();
    // If no dates provided, calculate for all time (don't filter by date)
    const useDateFilter = !!startDate || !!endDate;
    const start = startDate || new Date(2000, 0, 1);
    const end = endDate || now;

    const [
      totalCars,
      availableCars,
      activeRentals,
      totalRevenue,
      totalPenalties,
      totalDeposits,
    ] = await Promise.all([
      this.carRepository.findAll(),
      this.carRepository.findAvailableCars(),
      this.rentalRepository.findActiveRentals(),
      this.getTotalRevenue(start, end, useDateFilter),
      this.getTotalPenalties(start, end),
      this.getTotalDeposits(),
    ]);

    // Get completed rentals separately to avoid loading all rentals unnecessarily
    const completedRentals = await this.rentalRepository.findByStatus(RentalStatus.COMPLETED);
    const totalClients = await this.clientRepository.findAll();

    // Calculate average rental duration
    const avgRentalDuration = await this.getAverageRentalDuration();

    // Calculate occupancy rate
    const occupancyRate = await this.calculateOccupancyRate();

    return {
      totalCars: totalCars.length,
      availableCars: availableCars.length,
      rentedCars: totalCars.filter(c => c.status === CarStatus.RENTED).length,
      maintenanceCars: totalCars.filter(c => c.status === CarStatus.MAINTENANCE).length,
      totalClients: totalClients.length,
      activeRentals: activeRentals.length,
      completedRentals: completedRentals.length,
      totalRevenue: totalRevenue,
      totalPenalties: totalPenalties,
      totalDeposits: totalDeposits,
      // Net revenue includes: completed rentals + active rentals (expected) + deposits + penalties
      netRevenue: totalRevenue,
      averageRentalDuration: avgRentalDuration,
      occupancyRate: occupancyRate,
      averageRevenuePerRental: completedRentals.length > 0 
        ? totalRevenue / completedRentals.length 
        : 0,
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
    // Get all rentals with relations loaded
    const rentals = await this.rentalRepository.findAllWithRelations();
    const carRentalCount: { [key: number]: { car: any; count: number; revenue: number } } = {};

    rentals.forEach((rental: Rental) => {
      // Check if car relation is loaded
      if (!rental.car || !rental.car.id) {
        return; // Skip rentals without car relation
      }
      
      const carId = rental.car.id;
      if (!carRentalCount[carId]) {
        carRentalCount[carId] = {
          car: rental.car,
          count: 0,
          revenue: 0,
        };
      }
      carRentalCount[carId].count++;
      
      // Calculate net revenue: cost + penalties
      // IMPORTANT: Deposit is NOT revenue - it's money we hold and return (minus penalties if any)
      // Revenue = cost + penalty (deposit doesn't affect revenue, it's just held and returned)
      let revenue = 0;
      const deposit = Number(rental.depositAmount || 0);
      const cost = Number(rental.totalCost || 0);
      const penalty = Number(rental.penaltyAmount || 0);
      
      if (rental.status === RentalStatus.COMPLETED) {
        // Completed: revenue = cost + penalties
        // Deposit is returned (minus penalties if any), but doesn't affect revenue calculation
        revenue = cost + penalty;
      } else if (rental.status === RentalStatus.ACTIVE) {
        // Active: expected revenue = expected cost
        // Deposit will be returned when completed (if no penalties)
        revenue = cost;
      } else if (rental.status === RentalStatus.CANCELLED) {
        // Cancelled: revenue = cost + penalties (for actual days used)
        // If cancelled before start (cost = 0, penalty = 0), revenue = 0
        // Revenue is always cost + penalty (never negative, as cost and penalty are non-negative)
        revenue = cost + penalty;
      }
      
      carRentalCount[carId].revenue += revenue;
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
   * Get top clients (most active) with detailed financial information
   */
  async getTopClients(limit: number = 10): Promise<any[]> {
    // Get all rentals with relations loaded
    const rentals = await this.rentalRepository.findAllWithRelations();
    
    const clientRentalCount: { 
      [key: number]: { 
        client: any; 
        count: number; 
        totalReceived: number;  // Total money received from client
        totalCost: number;      // Total rental cost (without deposit)
        totalPenalties: number; // Total penalties
        totalDeposits: number;  // Total deposits paid
        totalToReturn: number;  // Total deposit to return (deposit - penalties if any)
        netRevenue: number;     // Net revenue (cost + penalties - deposit return)
      } 
    } = {};

    rentals.forEach((rental: Rental) => {
      // Check if client relation is loaded
      if (!rental.client || !rental.client.id) {
        return; // Skip rentals without client relation
      }
      
      const clientId = rental.client.id;
      if (!clientRentalCount[clientId]) {
        clientRentalCount[clientId] = {
          client: rental.client,
          count: 0,
          totalReceived: 0,
          totalCost: 0,
          totalPenalties: 0,
          totalDeposits: 0,
          totalToReturn: 0,
          netRevenue: 0,
        };
      }
      
      const stats = clientRentalCount[clientId];
      stats.count++;
      
      const deposit = Number(rental.depositAmount || 0);
      const cost = Number(rental.totalCost || 0);
      const penalty = Number(rental.penaltyAmount || 0);
      
      // Accumulate values
      stats.totalDeposits += deposit;
      stats.totalPenalties += penalty;
      
      if (rental.status === RentalStatus.COMPLETED) {
        // Completed rental: actual cost + penalties
        stats.totalCost += cost;
        
        // Calculate deposit return: deposit minus penalties (if penalties exceed deposit, return 0)
        const depositToReturn = Math.max(0, deposit - penalty);
        stats.totalToReturn += depositToReturn;
        
        // Net revenue: cost + penalties (deposit doesn't affect revenue)
        // Revenue is what we earn, not what we receive minus what we return
        stats.netRevenue += cost + penalty;
        
        // Total received: deposit + cost + penalty (client paid everything)
        stats.totalReceived += deposit + cost + penalty;
      } else if (rental.status === RentalStatus.ACTIVE) {
        // Active rental: expected cost
        stats.totalCost += cost;
        
        // Total received: deposit + expected cost (client has paid both)
        stats.totalReceived += deposit + cost;
        
        // Deposit will be returned if no penalties (we don't know yet)
        // For display, we assume full deposit return for active rentals
        stats.totalToReturn += deposit;
        
        // Net revenue: expected cost (deposit doesn't affect revenue)
        stats.netRevenue += cost;
      } else if (rental.status === RentalStatus.CANCELLED) {
        // Cancelled rental: charge for actual days used
        stats.totalCost += cost;
        
        // Calculate deposit return: deposit minus penalties (if any)
        const depositToReturn = Math.max(0, deposit - penalty);
        stats.totalToReturn += depositToReturn;
        
        // Net revenue: cost + penalties (for actual days used)
        // If cancelled before start (cost = 0, penalty = 0), revenue = 0
        // Revenue is always cost + penalty (never negative)
        stats.netRevenue += cost + penalty;
        
        // Total received: deposit + cost + penalty (if any)
        stats.totalReceived += deposit + cost + penalty;
      }
    });

    return Object.values(clientRentalCount)
      .map(item => {
        // Net revenue is already calculated correctly as cost + penalties
        // Don't recalculate as totalReceived - totalToReturn because:
        // - totalReceived includes deposit (which is not revenue)
        // - totalToReturn includes deposit return (which is not an expense)
        // Revenue = cost + penalties (deposit is just held and returned)
        
        return {
          client: {
            id: item.client.id,
            fullName: item.client.fullName,
            phone: item.client.phone,
          },
          rentalCount: item.count,
          totalSpent: item.totalReceived, // For backward compatibility
          totalReceived: item.totalReceived,
          totalCost: item.totalCost,
          totalPenalties: item.totalPenalties,
          totalDeposits: item.totalDeposits,
          totalToReturn: item.totalToReturn,
          netRevenue: item.netRevenue, // Already calculated as cost + penalties
        };
      })
      .sort((a, b) => b.netRevenue - a.netRevenue)
      .slice(0, limit);
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
   * Simply sums up netRevenue from all clients (from getTopClients)
   * This is the cleanest approach: total revenue = sum of all clients' net revenue
   */
  private async getTotalRevenue(startDate: Date, endDate: Date, useDateFilter: boolean = true): Promise<number> {
    // Get all clients with their net revenue
    // Use a very large limit to get all clients
    const allClients = await this.getTopClients(10000);
    
    // If date filter is used, we need to recalculate for filtered period
    if (useDateFilter) {
      // Get all rentals and filter by date
      const allRentals = await this.rentalRepository.findAllWithRelations();
      const clientNetRevenue: { [key: number]: number } = {};
      
      allRentals.forEach(rental => {
        if (!rental.client || !rental.client.id) return;
        
        const deposit = Number(rental.depositAmount || 0);
        const cost = Number(rental.totalCost || 0);
        const penalty = Number(rental.penaltyAmount || 0);
        
        // Check if rental should be included in this period
        let includeInPeriod = false;
        
        if (rental.status === RentalStatus.COMPLETED) {
          const completionDate = rental.actualEndDate || rental.expectedEndDate;
          includeInPeriod = completionDate >= startDate && completionDate <= endDate;
        } else if (rental.status === RentalStatus.ACTIVE) {
          includeInPeriod = rental.startDate >= startDate && rental.startDate <= endDate;
        } else if (rental.status === RentalStatus.CANCELLED) {
          const cancellationDate = rental.actualEndDate || rental.expectedEndDate;
          includeInPeriod = cancellationDate >= startDate && cancellationDate <= endDate;
        }
        
        if (includeInPeriod) {
          if (!clientNetRevenue[rental.client.id]) {
            clientNetRevenue[rental.client.id] = 0;
          }
          
          if (rental.status === RentalStatus.COMPLETED) {
            // Revenue = cost + penalties (deposit doesn't affect revenue)
            clientNetRevenue[rental.client.id] += cost + penalty;
          } else if (rental.status === RentalStatus.ACTIVE) {
            // Expected revenue = expected cost
            clientNetRevenue[rental.client.id] += cost;
          } else if (rental.status === RentalStatus.CANCELLED) {
            // Revenue = cost + penalties (for actual days used)
            // Revenue is always cost + penalty (never negative)
            clientNetRevenue[rental.client.id] += cost + penalty;
          }
        }
      });
      
      // Sum up all clients' net revenue
      return Object.values(clientNetRevenue).reduce((sum, revenue) => sum + revenue, 0);
    } else {
      // No date filter: simply sum up netRevenue from all clients
      return allClients.reduce((sum, client) => sum + client.netRevenue, 0);
    }
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
    const completedRentals = await this.rentalRepository.findByStatus(RentalStatus.COMPLETED);
    
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
    return lastMonthRevenue;
  }
}

