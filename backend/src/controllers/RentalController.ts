import { Request, Response } from 'express';
import { RentalService } from '../services/RentalService';

/**
 * Controller for rental-related endpoints
 */
export class RentalController {
  private rentalService: RentalService;

  constructor() {
    this.rentalService = new RentalService();
  }

  /**
   * GET /api/rentals - Get all rentals
   */
  getAllRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getAllRentals();
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/active - Get active rentals
   */
  getActiveRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getActiveRentals();
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/:id - Get rental by ID
   */
  getRentalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const rental = await this.rentalService.getRentalById(id);
      
      if (!rental) {
        res.status(404).json({ error: 'Rental not found' });
        return;
      }
      
      res.json(rental);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/client/:clientId - Get rentals by client ID
   */
  getRentalsByClientId = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = parseInt(req.params.clientId);
      const rentals = await this.rentalService.getRentalsByClientId(clientId);
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/car/:carId - Get rentals by car ID
   */
  getRentalsByCarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const carId = parseInt(req.params.carId);
      const rentals = await this.rentalService.getRentalsByCarId(carId);
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals - Create a new rental
   */
  createRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId, carId, startDate, expectedEndDate } = req.body;
      
      if (!clientId || !carId || !startDate || !expectedEndDate) {
        res.status(400).json({ error: 'Missing required fields: clientId, carId, startDate, expectedEndDate' });
        return;
      }
      
      const rental = await this.rentalService.createRental(
        clientId,
        carId,
        new Date(startDate),
        new Date(expectedEndDate)
      );
      
      res.status(201).json(rental);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/complete - Complete a rental
   */
  completeRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { actualEndDate } = req.body;
      
      const rental = await this.rentalService.completeRental(
        id,
        actualEndDate ? new Date(actualEndDate) : undefined
      );
      
      res.json(rental);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/my - Get rentals for current user (USER role)
   */
  getMyRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Get user full name from database if needed
      const { UserRepository } = await import('../repositories/UserRepository');
      const userRepository = new UserRepository();
      const userData = await userRepository.findById(user.id);
      
      const rentals = await this.rentalService.getRentalsForUser(
        user.id,
        user.email,
        userData?.fullName
      );
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/book - Create booking for user (USER role)
   */
  createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const { carId, startDate, expectedEndDate } = req.body;
      
      if (!carId || !startDate || !expectedEndDate) {
        res.status(400).json({ error: 'Missing required fields: carId, startDate, expectedEndDate' });
        return;
      }
      
      // Get user full name from database
      const { UserRepository } = await import('../repositories/UserRepository');
      const userRepository = new UserRepository();
      const userData = await userRepository.findById(user.id);
      
      const rental = await this.rentalService.createBookingForUser(
        user.id,
        user.email,
        userData?.fullName,
        carId,
        new Date(startDate),
        new Date(expectedEndDate)
      );
      
      res.status(201).json(rental);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/cancel - Cancel a rental
   */
  cancelRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      
      // For USER role, check if rental belongs to user
      if (user?.role === 'user') {
        const rental = await this.rentalService.getRentalById(id);
        if (!rental) {
          res.status(404).json({ error: 'Rental not found' });
          return;
        }
        
        // Get user's client
        const { UserRepository } = await import('../repositories/UserRepository');
        const userRepository = new UserRepository();
        const userData = await userRepository.findById(user.id);
        const client = await this.rentalService.getOrCreateClientForUser(
          user.id,
          user.email,
          userData?.fullName
        );
        
        if (rental.client.id !== client.id) {
          res.status(403).json({ error: 'You can only cancel your own rentals' });
          return;
        }
      }
      
      const { cancellationDate } = req.body;
      const cancelledRental = await this.rentalService.cancelRental(
        id,
        cancellationDate ? new Date(cancellationDate) : undefined
      );
      res.json(cancelledRental);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/penalty - Add penalty to rental
   */
  addPenalty = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || !reason) {
        res.status(400).json({ error: 'Missing required fields: amount, reason' });
        return;
      }
      
      const penalty = await this.rentalService.addPenalty(id, amount, reason);
      res.status(201).json(penalty);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

