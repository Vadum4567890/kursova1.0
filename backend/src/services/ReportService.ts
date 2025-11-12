import { RentalRepository } from '../repositories/RentalRepository';
import { CarRepository } from '../repositories/CarRepository';
import { ReportTemplate, FinancialReport, OccupancyReport, AvailabilityReport } from '../patterns/template/ReportTemplate';
import { ReportFactory, FinancialReportFactory, OccupancyReportFactory, AvailabilityReportFactory } from '../patterns/factory/ReportFactory';
import { CarStatus } from '../models/Car.entity';
import { RentalStatus } from '../models/Rental.entity';

/**
 * Service for report generation
 * Uses Template Method and Factory patterns
 */
export class ReportService {
  private rentalRepository: RentalRepository;
  private carRepository: CarRepository;

  constructor() {
    this.rentalRepository = new RentalRepository();
    this.carRepository = new CarRepository();
  }

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
      // - If cancelled after start: cost=actual days, penalty (if late), deposit returned minus penalty → net = cost + penalty
      // Simplified: net = cost + penalty (same as completed)
      return sum + cost + penalty;
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
}

