import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

/**
 * Controller for analytics endpoints
 */
export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * GET /api/analytics/dashboard - Get dashboard statistics
   */
  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await this.analyticsService.getDashboardStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/analytics/revenue - Get revenue statistics
   */
  getRevenueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await this.analyticsService.getRevenueStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/analytics/popular-cars - Get popular cars
   */
  getPopularCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cars = await this.analyticsService.getPopularCars(limit);
      res.json(cars);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/analytics/top-clients - Get top clients
   */
  getTopClients = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const clients = await this.analyticsService.getTopClients(limit);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/analytics/occupancy-rate - Get occupancy rate
   */
  getOccupancyRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const rate = await this.analyticsService.calculateOccupancyRate();
      res.json({ occupancyRate: rate });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/analytics/revenue-forecast - Get revenue forecast
   */
  getRevenueForecast = async (req: Request, res: Response): Promise<void> => {
    try {
      const forecast = await this.analyticsService.getRevenueForecast();
      res.json({ forecast });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

