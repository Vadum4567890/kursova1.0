import { Request, Response, NextFunction } from 'express';
import { PenaltyService } from '../services/PenaltyService';
import { AuthRequest } from '../middleware/auth';

export class PenaltyController {
  constructor(private penaltyService: PenaltyService) {}

  getMyPenalties = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const penalties = await this.penaltyService.getPenaltiesForRenter(req.user.id);
      // Плоскі DTO: Decimal/pg-типи та вкладені зв’язки не повинні ламати JSON.stringify.
      res.json(
        penalties.map((p) => ({
          id: p.id,
          rentalId: p.rentalId,
          amount: Number(p.amount),
          reason: p.reason,
          date: p.date,
          createdAt: p.createdAt,
          rental: p.rental
            ? {
                id: p.rental.id,
                carId: p.rental.carId,
                renterUserId: p.rental.renterUserId,
                startDate: p.rental.startDate,
                expectedEndDate: p.rental.expectedEndDate,
                actualEndDate: p.rental.actualEndDate,
                depositAmount: Number(p.rental.depositAmount),
                totalCost: Number(p.rental.totalCost),
                penaltyAmount: Number(p.rental.penaltyAmount),
                status: p.rental.status,
                createdAt: p.rental.createdAt,
                updatedAt: p.rental.updatedAt,
              }
            : undefined,
        }))
      );
    } catch (error) {
      next(error);
    }
  };

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
      // Захист від маршруту /:id, якщо колись обробляється "me" — PostgreSQL падає на uuid
      if (!id || id === 'me' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        res.status(404).json({ error: 'Penalty not found' });
        return;
      }
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

