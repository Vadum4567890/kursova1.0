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
    const totalRevenue = completedRentals.reduce((sum, r) => sum + parseFloat(r.totalCost.toString()), 0);
    const totalPenalties = completedRentals.reduce((sum, r) => sum + parseFloat(r.penaltyAmount.toString()), 0);

    // Use template method
    const financialReport = new FinancialReport();
    const data = {
      totalRevenue,
      totalCosts: 0, // Can be calculated based on car maintenance, etc.
      rentals: completedRentals,
      totalPenalties,
    };

    // Override collectData for this instance
    (financialReport as any).collectData = () => data;
    return financialReport.generate();
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
    return occupancyReport.generate();
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

    const availabilityReport = new AvailabilityReport();
    const data = {
      availableCars,
      rentedCars,
      maintenanceCars,
    };

    (availabilityReport as any).collectData = () => data;
    return availabilityReport.generate();
  }
}

