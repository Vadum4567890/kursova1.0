import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';

/**
 * Controller for search endpoints
 * Uses Dependency Injection for services
 */
export class SearchController {
  constructor(private searchService: SearchService) {}

  /**
   * POST /api/search/cars - Search cars
   */
  searchCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria = req.body;
      const cars = await this.searchService.searchCars(criteria);
      res.json({ data: cars });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/search/clients?q=query - Search clients
   */
  searchClients = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      const clients = await this.searchService.searchClients(query);
      res.json({ data: clients });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/search/rentals - Search rentals
   */
  searchRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria = req.body;
      if (criteria.startDate) criteria.startDate = new Date(criteria.startDate);
      if (criteria.endDate) criteria.endDate = new Date(criteria.endDate);
      
      const rentals = await this.searchService.searchRentals(criteria);
      res.json({ data: rentals });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

