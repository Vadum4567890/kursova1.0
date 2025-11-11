import { Request, Response } from 'express';
import { PenaltyService } from '../services/PenaltyService';

/**
 * Controller for penalty-related endpoints
 */
export class PenaltyController {
  private penaltyService: PenaltyService;

  constructor() {
    this.penaltyService = new PenaltyService();
  }

  /**
   * GET /api/penalties - Get all penalties
   */
  getAllPenalties = async (req: Request, res: Response): Promise<void> => {
    try {
      const penalties = await this.penaltyService.getAllPenalties();
      res.json(penalties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/penalties/:id - Get penalty by ID
   */
  getPenaltyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const penalty = await this.penaltyService.getPenaltyById(id);
      
      if (!penalty) {
        res.status(404).json({ error: 'Penalty not found' });
        return;
      }
      
      res.json(penalty);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/penalties/rental/:rentalId - Get penalties by rental ID
   */
  getPenaltiesByRentalId = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentalId = parseInt(req.params.rentalId);
      const penalties = await this.penaltyService.getPenaltiesByRentalId(rentalId);
      res.json(penalties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/penalties/rental/:rentalId/total - Get total penalty amount for rental
   */
  getTotalPenaltyByRentalId = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentalId = parseInt(req.params.rentalId);
      const total = await this.penaltyService.getTotalPenaltyByRentalId(rentalId);
      res.json({ rentalId, total });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/penalties - Create a new penalty
   */
  createPenalty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rentalId, amount, reason } = req.body;
      
      if (!rentalId || !amount || !reason) {
        res.status(400).json({ error: 'Missing required fields: rentalId, amount, reason' });
        return;
      }
      
      const penalty = await this.penaltyService.createPenalty(rentalId, amount, reason);
      res.status(201).json(penalty);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * DELETE /api/penalties/:id - Delete penalty
   */
  deletePenalty = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.penaltyService.deletePenalty(id);
      
      if (!success) {
        res.status(404).json({ error: 'Penalty not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

