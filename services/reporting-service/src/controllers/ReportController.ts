import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  constructor(private reportService: ReportService) {}

  generateFinancialReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.reportService.generateFinancialReport(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ data: report });
    } catch (error) {
      next(error);
    }
  };

  generateOccupancyReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.generateOccupancyReport();
      res.json({ data: report });
    } catch (error) {
      next(error);
    }
  };

  generateAvailabilityReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.generateAvailabilityReport();
      res.json({ data: report });
    } catch (error) {
      next(error);
    }
  };

  generateCarReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.reportService.generateCarReport(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ data: report });
    } catch (error) {
      next(error);
    }
  };
}

