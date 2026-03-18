import { Request, Response, NextFunction } from 'express';
import { PenaltyService } from '../services/PenaltyService';

export class PenaltyController {
  constructor(private penaltyService: PenaltyService) {}

  getAllPenalties = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const penalties = await this.penaltyService.getAllPenalties();
      res.json(penalties);
    } catch (error) {
      next(error);
    }
  };

  getPenaltiesByRentalId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rentalId } = req.params;
      const penalties = await this.penaltyService.getPenaltiesByRentalId(rentalId);
      res.json(penalties);
    } catch (error) {
      next(error);
    }
  };

  getTotalPenaltyByRentalId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rentalId } = req.params;
      const total = await this.penaltyService.getTotalPenaltyByRentalId(rentalId);
      res.json({ rentalId, total });
    } catch (error) {
      next(error);
    }
  };

  getPenaltyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const penalty = await this.penaltyService.getPenaltyById(id);
      if (!penalty) {
        res.status(404).json({ error: 'Penalty not found' });
        return;
      }
      res.json(penalty);
    } catch (error) {
      next(error);
    }
  };

  createPenalty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rentalId, amount, reason } = req.body;
      const created = await this.penaltyService.createPenalty(String(rentalId), Number(amount), String(reason));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  };

  deletePenalty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.penaltyService.deletePenalty(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

