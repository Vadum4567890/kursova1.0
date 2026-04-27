import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.analyticsService.getDashboardStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  };

  getRevenueStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.analyticsService.getRevenueStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  };

  getPopularCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cars = await this.analyticsService.getPopularCars(limit);
      res.json({ data: cars });
    } catch (error) {
      next(error);
    }
  };

  getTopClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { startDate, endDate } = req.query;
      const clients = await this.analyticsService.getTopClients(
        limit,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ data: clients });
    } catch (error) {
      next(error);
    }
  };

  getOccupancyRate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rate = await this.analyticsService.calculateOccupancyRate();
      res.json({ data: { occupancyRate: rate } });
    } catch (error) {
      next(error);
    }
  };

  getRevenueForecast = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const forecast = await this.analyticsService.getRevenueForecast();
      res.json({ data: forecast });
    } catch (error) {
      next(error);
    }
  };
}

