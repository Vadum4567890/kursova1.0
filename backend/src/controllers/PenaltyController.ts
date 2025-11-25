import { Request, Response } from 'express';
import { IPenaltyService } from '../core/interfaces/IPenaltyService';
import { IRentalService } from '../core/interfaces/IRentalService';
import { IUserRepository } from '../core/interfaces/IUserRepository';
import { CreatePenaltyDto } from '../dto/requests/PenaltyRequest.dto';
import { PenaltyMapper } from '../dto/mappers/PenaltyMapper';

/**
 * Controller for penalty-related endpoints
 * Uses Dependency Injection for services
 */
export class PenaltyController {
  constructor(
    private penaltyService: IPenaltyService,
    private rentalService: IRentalService,
    private userRepository: IUserRepository
  ) {}

  /**
   * GET /api/penalties - Get all penalties (or user's penalties for USER role)
   */
  getAllPenalties = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      // For USER role, return only penalties for their rentals
      if (user?.role === 'user') {
        const userData = await this.userRepository.findById(user.id);
        
        // Get all rentals for user (this now finds all possible clients)
        const rentals = await this.rentalService.getRentalsForUser(
          user.id,
          user.email,
          userData?.fullName
        );
        
        const rentalIds = rentals.map((r: any) => r.id);
        if (rentalIds.length === 0) {
          res.json([]);
          return;
        }
        
        // Get penalties for user's rentals with relations loaded
        const userPenalties = [];
        for (const rentalId of rentalIds) {
          const penalties = await this.penaltyService.getPenaltiesByRentalId(rentalId);
          userPenalties.push(...penalties);
        }
        
        // Remove duplicates
        const uniquePenalties = userPenalties.filter((penalty, index, self) =>
          index === self.findIndex(p => p.id === penalty.id)
        );
        
        // Ensure all penalties have relations loaded
        const penaltiesWithRelations = await Promise.all(
          uniquePenalties.map(async (penalty) => {
            if (!penalty.rental) {
              const fullPenalty = await this.penaltyService.getPenaltyById(penalty.id);
              return fullPenalty || penalty;
            }
            return penalty;
          })
        );
        
        const penaltiesDto = PenaltyMapper.toResponseDtoList(penaltiesWithRelations);
        res.json(penaltiesDto);
        return;
      }
      
      const penalties = await this.penaltyService.getAllPenalties();
      const penaltiesDto = PenaltyMapper.toResponseDtoList(penalties);
      res.json(penaltiesDto);
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
      
      const penaltyDto = PenaltyMapper.toResponseDto(penalty);
      res.json(penaltyDto);
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
      const penaltiesDto = PenaltyMapper.toResponseDtoList(penalties);
      res.json(penaltiesDto);
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
      const createPenaltyDto: CreatePenaltyDto = req.body;
      
      if (!createPenaltyDto.rentalId || !createPenaltyDto.amount || !createPenaltyDto.reason) {
        res.status(400).json({ error: 'Missing required fields: rentalId, amount, reason' });
        return;
      }
      
      const penalty = await this.penaltyService.createPenalty(
        createPenaltyDto.rentalId,
        createPenaltyDto.amount,
        createPenaltyDto.reason
      );
      const penaltyDto = PenaltyMapper.toResponseDto(penalty);
      res.status(201).json(penaltyDto);
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

