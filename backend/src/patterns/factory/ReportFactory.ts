/**
 * Factory Method Pattern for creating different types of reports
 */

export interface Report {
  generate(): any;
  getData(): any;
}

export interface ReportData {
  [key: string]: any;
}

/**
 * Abstract factory for report creation
 */
export abstract class ReportFactory {
  /**
   * Abstract method to create a report
   */
  public abstract createReport(): Report;

  /**
   * Template method for report generation
   */
  public generateReport(): Report {
    const report = this.createReport();
    report.generate();
    return report;
  }
}

/**
 * Financial report factory
 */
export class FinancialReportFactory extends ReportFactory {
  public createReport(): Report {
    return new FinancialReport();
  }
}

/**
 * Occupancy report factory
 */
export class OccupancyReportFactory extends ReportFactory {
  public createReport(): Report {
    return new OccupancyReport();
  }
}

/**
 * Availability report factory
 */
export class AvailabilityReportFactory extends ReportFactory {
  public createReport(): Report {
    return new AvailabilityReport();
  }
}

/**
 * Base report implementation
 */
abstract class BaseReport implements Report {
  protected data: ReportData = {};

  public abstract generate(): any;

  public getData(): ReportData {
    return this.data;
  }
}

/**
 * Financial report implementation
 */
class FinancialReport extends BaseReport {
  public generate(): any {
    this.data = {
      type: 'financial',
      title: 'Financial Report',
      timestamp: new Date().toISOString(),
    };
    return this.data;
  }
}

/**
 * Occupancy report implementation
 */
class OccupancyReport extends BaseReport {
  public generate(): any {
    this.data = {
      type: 'occupancy',
      title: 'Occupancy Report',
      timestamp: new Date().toISOString(),
    };
    return this.data;
  }
}

/**
 * Availability report implementation
 */
class AvailabilityReport extends BaseReport {
  public generate(): any {
    this.data = {
      type: 'availability',
      title: 'Availability Report',
      timestamp: new Date().toISOString(),
    };
    return this.data;
  }
}

