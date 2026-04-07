import { Request, Response, NextFunction } from 'express';
import { RentalService } from '../services/RentalService';
import { AuthRequest } from '../middleware/auth';

export class RentalController {
  private rentalService: RentalService;

  constructor() {
    this.rentalService = new RentalService();
  }

  createRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { carId, renterUserId, startDate, expectedEndDate } = req.body;
      const rental = await this.rentalService.createRental(
        carId,
        renterUserId,
        new Date(startDate),
        new Date(expectedEndDate)
      );
      res.status(201).json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };

  completeRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actualEndDate = req.body?.actualEndDate ? new Date(req.body.actualEndDate) : undefined;
      const rental = await this.rentalService.completeRental(id, actualEndDate);
      res.json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };

  cancelRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const cancellationDate = req.body?.cancellationDate ? new Date(req.body.cancellationDate) : undefined;
      const rental = await this.rentalService.cancelRental(id, cancellationDate);
      res.json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };

  getRentalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rental = await this.rentalService.getRentalById(req.params.id);
      if (!rental) {
        res.status(404).json({ success: false, error: { message: 'Rental not found' } });
        return;
      }
      res.json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };

  getAllRentals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rentals = await this.rentalService.getAllRentals();
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  getActiveRentals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rentals = await this.rentalService.getActiveRentals();
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  getRentalsByCarId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rentals = await this.rentalService.getRentalsByCarId(req.params.carId);
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  getRentalsByRenterId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rentals = await this.rentalService.getRentalsByRenterId(req.params.renterId);
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  getBookedDates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dates = await this.rentalService.getBookedDates(req.params.carId);
      res.json({ success: true, data: dates });
    } catch (error) {
      next(error);
    }
  };

  getMyRentals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const rentals = await this.rentalService.getRentalsForCurrentRenter(req.user.id);
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  createBookingForCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { carId, startDate, expectedEndDate } = req.body;
      if (!carId || !startDate || !expectedEndDate) {
        res.status(400).json({
          success: false,
          error: { message: 'Missing required fields: carId, startDate, expectedEndDate' },
        });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(expectedEndDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid startDate or expectedEndDate' },
        });
        return;
      }

      const rental = await this.rentalService.createBookingForCurrentRenter(
        req.user.id,
        String(carId),
        start,
        end,
      );

      res.status(201).json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };
}
