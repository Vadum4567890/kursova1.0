/**
 * Template Method Pattern for report generation
 * Defines the skeleton of the algorithm, allowing subclasses to override specific steps
 */

export interface ReportResult {
  data: any;
  format: string;
  timestamp: Date;
}

/**
 * Abstract template for report generation
 */
export abstract class ReportTemplate {
  /**
   * Template method - defines the algorithm structure
   */
  public generate(): ReportResult {
    const data = this.collectData();
    const processedData = this.processData(data);
    const formattedData = this.formatData(processedData);
    return this.exportData(formattedData);
  }

  /**
   * Abstract methods - must be implemented by subclasses
   */
  protected abstract collectData(): any;
  protected abstract processData(data: any): any;
  protected abstract formatData(data: any): any;

  /**
   * Hook method - can be overridden
   */
  protected exportData(data: any): ReportResult {
    return {
      data,
      format: 'json',
      timestamp: new Date(),
    };
  }
}

/**
 * Financial report implementation
 */
export class FinancialReport extends ReportTemplate {
  protected collectData(): any {
    // Collect financial data
    return {
      totalRevenue: 0,
      totalCosts: 0,
      rentals: [],
    };
  }

  protected processData(data: any): any {
    // Process financial data
    return {
      ...data,
      totalRevenue: data.rentals.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0),
      profit: (data.totalRevenue || 0) - (data.totalCosts || 0),
    };
  }

  protected formatData(data: any): any {
    // Format for financial report
    return {
      title: 'Financial Report',
      period: new Date().getFullYear().toString(),
      summary: {
        revenue: data.totalRevenue,
        costs: data.totalCosts,
        profit: data.profit,
      },
      details: data.rentals,
    };
  }
}

/**
 * Occupancy report implementation
 */
export class OccupancyReport extends ReportTemplate {
  protected collectData(): any {
    // Collect occupancy data
    return {
      cars: [],
      rentals: [],
    };
  }

  protected processData(data: any): any {
    // Calculate occupancy rates
    const occupancy = (data.cars || []).map((car: any) => ({
      carId: car.id,
      carModel: `${car.brand} ${car.model}`,
      occupancyRate: this.calculateOccupancyRate(car, data.rentals),
    }));
    return { occupancy };
  }

  protected formatData(data: any): any {
    return {
      title: 'Occupancy Report',
      averageOccupancy: this.calculateAverage(data.occupancy),
      details: data.occupancy,
    };
  }

  private calculateOccupancyRate(car: any, rentals: any[]): number {
    // Simplified calculation
    const carRentals = rentals.filter((r: any) => r.carId === car.id);
    return carRentals.length > 0 ? 0.75 : 0;
  }

  private calculateAverage(occupancy: any[]): number {
    if (occupancy.length === 0) return 0;
    const sum = occupancy.reduce((acc, item) => acc + (item.occupancyRate || 0), 0);
    return sum / occupancy.length;
  }
}

/**
 * Availability report implementation
 */
export class AvailabilityReport extends ReportTemplate {
  protected collectData(): any {
    return {
      availableCars: [],
      rentedCars: [],
      maintenanceCars: [],
    };
  }

  protected processData(data: any): any {
    return {
      total: (data.availableCars?.length || 0) + 
             (data.rentedCars?.length || 0) + 
             (data.maintenanceCars?.length || 0),
      available: data.availableCars?.length || 0,
      rented: data.rentedCars?.length || 0,
      maintenance: data.maintenanceCars?.length || 0,
    };
  }

  protected formatData(data: any): any {
    return {
      title: 'Availability Report',
      statistics: data,
      timestamp: new Date(),
    };
  }
}

