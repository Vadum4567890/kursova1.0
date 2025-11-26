import { IRentalRepository } from '../core/interfaces/IRentalRepository';
import { ICarRepository } from '../core/interfaces/ICarRepository';
import { ReportTemplate, FinancialReport, OccupancyReport, AvailabilityReport } from '../patterns/template/ReportTemplate';
import { ReportFactory, FinancialReportFactory, OccupancyReportFactory, AvailabilityReportFactory } from '../patterns/factory/ReportFactory';
import { CarStatus } from '../models/Car.entity';
import { RentalStatus } from '../models/Rental.entity';

/**
 * Service for report generation
 * Uses Template Method and Factory patterns
 */
export class ReportService {
  constructor(
    private rentalRepository: IRentalRepository,
    private carRepository: ICarRepository
  ) {}

  /**
   * Generate financial report
   */
  async generateFinancialReport(startDate?: Date, endDate?: Date): Promise<any> {
    const factory = new FinancialReportFactory();
    const report = factory.createReport();

    // Collect data
    let rentals;
    if (startDate && endDate) {
      rentals = await this.rentalRepository.findByDateRange(startDate, endDate);
    } else {
      rentals = await this.rentalRepository.findAll();
    }

    const completedRentals = rentals.filter(r => r.status === RentalStatus.COMPLETED);
    const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE);
    const cancelledRentals = rentals.filter(r => r.status === RentalStatus.CANCELLED);
    
    // Calculate revenue from completed rentals (actual cost + penalties)
    const totalRevenue = completedRentals.reduce((sum, r) => 
      sum + parseFloat(r.totalCost.toString()) + parseFloat(r.penaltyAmount.toString()), 0
    );
    
    // Add expected revenue from active rentals
    const expectedRevenue = activeRentals.reduce((sum, r) => 
      sum + parseFloat(r.totalCost.toString()), 0
    );
    
    // Calculate penalties (only from completed rentals, as active ones haven't been charged yet)
    const totalPenalties = completedRentals.reduce((sum, r) => sum + parseFloat(r.penaltyAmount.toString()), 0);
    
    // Total deposits collected (all rentals)
    const totalDeposits = rentals.reduce((sum, r) => sum + parseFloat(r.depositAmount.toString()), 0);
    
    // Calculate deposits to return for completed rentals
    // For completed: if penalty > 0, penalty is deducted from deposit, so we return (deposit - penalty)
    // If penalty = 0, we return full deposit
    const depositsToReturn = completedRentals.reduce((sum, r) => {
      const deposit = parseFloat(r.depositAmount.toString());
      const penalty = parseFloat(r.penaltyAmount.toString());
      // Return deposit minus penalty (if penalty exists, it's deducted from deposit)
      return sum + Math.max(0, deposit - penalty);
    }, 0);
    
    // For cancelled rentals, calculate deposits to return
    const cancelledDepositsToReturn = cancelledRentals.reduce((sum, r) => {
      const deposit = parseFloat(r.depositAmount.toString());
      const penalty = parseFloat(r.penaltyAmount.toString());
      // For cancelled: return deposit minus penalty (if any)
      return sum + Math.max(0, deposit - penalty);
    }, 0);
    
    // Net revenue calculation:
    // For completed rentals: 
    //   - Client paid: deposit + cost + penalty (if late)
    //   - We return: deposit - penalty (if penalty < deposit, else 0)
    //   - Net: (deposit + cost + penalty) - (deposit - penalty) = cost + 2*penalty (if penalty < deposit)
    //   OR: (deposit + cost + penalty) - 0 = deposit + cost + penalty (if penalty >= deposit)
    // But actually: client paid deposit + cost, penalty is deducted from deposit
    // So: Net = cost + penalty (penalty is already deducted from deposit, so we keep it)
    // Simplified: Net = cost + penalty (because penalty reduces deposit return)
    const completedNetRevenue = completedRentals.reduce((sum, r) => {
      const cost = parseFloat(r.totalCost.toString());
      const penalty = parseFloat(r.penaltyAmount.toString());
      const deposit = parseFloat(r.depositAmount.toString());
      const depositToReturn = Math.max(0, deposit - penalty);
      // Client paid: deposit + cost
      // We return: depositToReturn
      // Net: (deposit + cost) - depositToReturn = deposit + cost - (deposit - penalty) = cost + penalty
      return sum + cost + penalty;
    }, 0);
    
    const cancelledNetRevenue = cancelledRentals.reduce((sum, r) => {
      const cost = parseFloat(r.totalCost.toString());
      const penalty = parseFloat(r.penaltyAmount.toString());
      const deposit = parseFloat(r.depositAmount.toString());
      const depositToReturn = Math.max(0, deposit - penalty);
      // For cancelled rentals:
      // - If cancelled before start: cost=0, penalty=0, full deposit returned → net = 0
      // - If cancelled after start: cost=actual days, penalty (if late), deposit returned minus penalty → net = cost + penalty - depositToReturn
      // Revenue cannot be negative - if cancellation results in loss, revenue is 0
      const calculatedRevenue = cost + penalty - depositToReturn;
      return sum + Math.max(0, calculatedRevenue);
    }, 0);
    
    // Active rentals: we have deposits but haven't received full payment yet
    // So we don't count them in net revenue until they're completed
    const netRevenue = completedNetRevenue + cancelledNetRevenue;

    // Debug information
    const debugInfo = {
      completedRentalsCount: completedRentals.length,
      activeRentalsCount: activeRentals.length,
      cancelledRentalsCount: cancelledRentals.length,
      totalRevenueFromCompleted: totalRevenue,
      expectedRevenueFromActive: expectedRevenue,
      depositsToReturnFromCompleted: depositsToReturn,
      cancelledDepositsToReturn: cancelledDepositsToReturn,
      completedNetRevenue,
      cancelledNetRevenue,
      calculation: {
        completed: completedRentals.map(r => ({
          id: r.id,
          cost: parseFloat(r.totalCost.toString()),
          penalty: parseFloat(r.penaltyAmount.toString()),
          deposit: parseFloat(r.depositAmount.toString()),
          depositToReturn: Math.max(0, parseFloat(r.depositAmount.toString()) - parseFloat(r.penaltyAmount.toString())),
          net: parseFloat(r.totalCost.toString()) + parseFloat(r.penaltyAmount.toString())
        })),
        cancelled: cancelledRentals.map(r => ({
          id: r.id,
          cost: parseFloat(r.totalCost.toString()),
          penalty: parseFloat(r.penaltyAmount.toString()),
          deposit: parseFloat(r.depositAmount.toString()),
          depositToReturn: Math.max(0, parseFloat(r.depositAmount.toString()) - parseFloat(r.penaltyAmount.toString())),
          net: parseFloat(r.totalCost.toString()) + parseFloat(r.penaltyAmount.toString())
        }))
      }
    };

    return {
      totalRevenue: totalRevenue + expectedRevenue,
      totalPenalties,
      totalDeposits,
      netRevenue,
      debug: debugInfo,
      period: {
        startDate: startDate?.toISOString() || new Date(0).toISOString(),
        endDate: endDate?.toISOString() || new Date().toISOString(),
      },
      rentals: {
        total: rentals.length,
        completed: completedRentals.length,
        active: activeRentals.length,
        cancelled: cancelledRentals.length,
      },
    };
  }

  /**
   * Generate occupancy report
   */
  async generateOccupancyReport(): Promise<any> {
    const factory = new OccupancyReportFactory();
    const report = factory.createReport();

    const cars = await this.carRepository.findAll();
    const rentals = await this.rentalRepository.findAll();
    const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE);

    const occupancyReport = new OccupancyReport();
    const data = {
      cars,
      rentals: activeRentals,
    };

    (occupancyReport as any).collectData = () => data;
    const result = occupancyReport.generate();
    
    // Extract data from ReportResult and calculate proper occupancy
    const totalCars = cars.length;
    const rentedCars = cars.filter(c => c.status === CarStatus.RENTED).length;
    const availableCars = cars.filter(c => c.status === CarStatus.AVAILABLE).length;
    const maintenanceCars = cars.filter(c => c.status === CarStatus.MAINTENANCE).length;
    const occupancyRate = totalCars > 0 ? (rentedCars / totalCars) * 100 : 0;
    
    return {
      totalCars,
      availableCars,
      rentedCars,
      maintenanceCars,
      occupancyRate,
      byType: {
        economy: {
          total: cars.filter(c => c.type === 'economy').length,
          available: cars.filter(c => c.type === 'economy' && c.status === CarStatus.AVAILABLE).length,
          rented: cars.filter(c => c.type === 'economy' && c.status === CarStatus.RENTED).length,
        },
        business: {
          total: cars.filter(c => c.type === 'business').length,
          available: cars.filter(c => c.type === 'business' && c.status === CarStatus.AVAILABLE).length,
          rented: cars.filter(c => c.type === 'business' && c.status === CarStatus.RENTED).length,
        },
        premium: {
          total: cars.filter(c => c.type === 'premium').length,
          available: cars.filter(c => c.type === 'premium' && c.status === CarStatus.AVAILABLE).length,
          rented: cars.filter(c => c.type === 'premium' && c.status === CarStatus.RENTED).length,
        },
      },
    };
  }

  /**
   * Generate availability report
   */
  async generateAvailabilityReport(): Promise<any> {
    const factory = new AvailabilityReportFactory();
    const report = factory.createReport();

    const availableCars = await this.carRepository.findByStatus(CarStatus.AVAILABLE);
    const rentedCars = await this.carRepository.findByStatus(CarStatus.RENTED);
    const maintenanceCars = await this.carRepository.findByStatus(CarStatus.MAINTENANCE);
    
    // Get all cars with their next available date
    const allCars = await this.carRepository.findAll();
    const rentals = await this.rentalRepository.findAllWithRelations();
    const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE);
    
    const cars = allCars.map(car => {
      const activeRental = activeRentals.find(r => r.car?.id === car.id);
      return {
        id: car.id,
        brand: car.brand,
        model: car.model,
        status: car.status,
        nextAvailableDate: activeRental?.expectedEndDate 
          ? new Date(activeRental.expectedEndDate).toISOString()
          : undefined,
      };
    });

    return {
      availableCars: availableCars.length,
      unavailableCars: rentedCars.length + maintenanceCars.length,
      maintenanceCars: maintenanceCars.length,
      cars,
    };
  }

  /**
   * Generate car report with occupancy and financial indicators
   * Shows detailed information for each car
   */
  async generateCarReport(startDate?: Date, endDate?: Date): Promise<any> {
    const allCars = await this.carRepository.findAll();
    const allRentals = await this.rentalRepository.findAllWithRelations();
    
    // Filter rentals by date range if provided
    let rentals = allRentals;
    if (startDate && endDate) {
      rentals = allRentals.filter(r => {
        const rentalStart = new Date(r.startDate);
        return rentalStart >= startDate && rentalStart <= endDate;
      });
    }

    const carReports = allCars.map(car => {
      // Get all rentals for this car
      const carRentals = rentals.filter(r => r.car?.id === car.id);
      const completedRentals = carRentals.filter(r => r.status === RentalStatus.COMPLETED);
      const activeRentals = carRentals.filter(r => r.status === RentalStatus.ACTIVE);
      const cancelledRentals = carRentals.filter(r => r.status === RentalStatus.CANCELLED);

      // Calculate occupancy metrics
      const totalRentalDays = carRentals.reduce((sum, r) => {
        if (r.status === RentalStatus.COMPLETED && r.actualEndDate) {
          const start = new Date(r.startDate);
          const end = new Date(r.actualEndDate);
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        } else if (r.status === RentalStatus.ACTIVE) {
          const start = new Date(r.startDate);
          const now = new Date();
          return sum + Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        } else if (r.status === RentalStatus.CANCELLED && r.actualEndDate) {
          const start = new Date(r.startDate);
          const end = new Date(r.actualEndDate);
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }
        return sum;
      }, 0);

      // Calculate period days (default to last 365 days if no date range)
      const periodStart = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const periodEnd = endDate || new Date();
      const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const occupancyRate = periodDays > 0 ? (totalRentalDays / periodDays) * 100 : 0;
      const occupancyRatePercent = Math.min(100, occupancyRate);

      // Calculate financial metrics
      const totalRevenue = completedRentals.reduce((sum, r) => 
        sum + parseFloat(r.totalCost.toString()) + parseFloat(r.penaltyAmount.toString()), 0
      );
      const expectedRevenue = activeRentals.reduce((sum, r) => 
        sum + parseFloat(r.totalCost.toString()), 0
      );
      const totalPenalties = completedRentals.reduce((sum, r) => 
        sum + parseFloat(r.penaltyAmount.toString()), 0
      );
      const totalDeposits = carRentals.reduce((sum, r) => 
        sum + parseFloat(r.depositAmount.toString()), 0
      );
      const netRevenue = completedRentals.reduce((sum, r) => {
        const cost = parseFloat(r.totalCost.toString());
        const penalty = parseFloat(r.penaltyAmount.toString());
        return sum + cost + penalty;
      }, 0);

      // Get current status
      const currentStatus = car.status;
      const isCurrentlyRented = currentStatus === CarStatus.RENTED;
      const activeRental = activeRentals[0];
      const nextAvailableDate = activeRental?.expectedEndDate 
        ? new Date(activeRental.expectedEndDate).toISOString()
        : (currentStatus === CarStatus.AVAILABLE ? new Date().toISOString() : undefined);

      return {
        car: {
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          type: car.type,
          pricePerDay: parseFloat(car.pricePerDay.toString()),
          status: currentStatus,
        },
        occupancy: {
          totalRentalDays,
          periodDays,
          occupancyRate: occupancyRatePercent.toFixed(2),
          rentalCount: carRentals.length,
          completedCount: completedRentals.length,
          activeCount: activeRentals.length,
          cancelledCount: cancelledRentals.length,
          isCurrentlyRented,
          nextAvailableDate,
        },
        financial: {
          totalRevenue,
          expectedRevenue,
          totalPenalties,
          totalDeposits,
          netRevenue,
          averageRevenuePerRental: completedRentals.length > 0 
            ? netRevenue / completedRentals.length 
            : 0,
        },
      };
    });

    // Sort by net revenue (descending)
    carReports.sort((a, b) => b.financial.netRevenue - a.financial.netRevenue);

    return {
      period: {
        startDate: (startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: (endDate || new Date()).toISOString(),
      },
      summary: {
        totalCars: allCars.length,
        totalRevenue: carReports.reduce((sum, r) => sum + r.financial.totalRevenue, 0),
        totalNetRevenue: carReports.reduce((sum, r) => sum + r.financial.netRevenue, 0),
        totalPenalties: carReports.reduce((sum, r) => sum + r.financial.totalPenalties, 0),
        averageOccupancyRate: carReports.length > 0
          ? carReports.reduce((sum, r) => sum + parseFloat(r.occupancy.occupancyRate.toString()), 0) / carReports.length
          : 0,
      },
      cars: carReports,
    };
  }
}

