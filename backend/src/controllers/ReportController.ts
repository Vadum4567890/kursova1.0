import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

/**
 * Controller for report-related endpoints
 */
export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * GET /api/reports/financial - Generate financial report
   */
  generateFinancialReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      const report = await this.reportService.generateFinancialReport(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/reports/occupancy - Generate occupancy report
   */
  generateOccupancyReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.reportService.generateOccupancyReport();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/reports/availability - Generate availability report
   */
  generateAvailabilityReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.reportService.generateAvailabilityReport();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

