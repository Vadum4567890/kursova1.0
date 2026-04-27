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

  getEligibleReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await this.rentalService.getEligibleReviews(req.user.id);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  getReviewStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await this.rentalService.getReviewStatusForBooking(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMyReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await this.rentalService.getMyReviewForBooking(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId : '';
      const comment = typeof req.body?.comment === 'string' ? req.body.comment : null;
      const scores = req.body?.scores;
      if (!bookingId || !scores || typeof scores !== 'object') {
        res.status(400).json({
          success: false,
          error: { message: 'bookingId and scores are required' },
        });
        return;
      }
      const data = await this.rentalService.submitReview(req.user.id, bookingId, comment, scores);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const bookingId = req.params.id;
      const comment = typeof req.body?.comment === 'string' ? req.body.comment : null;
      const scores = req.body?.scores;
      if (!bookingId || !scores || typeof scores !== 'object') {
        res.status(400).json({
          success: false,
          error: { message: 'bookingId and scores are required' },
        });
        return;
      }
      const data = await this.rentalService.updateReview(req.user.id, bookingId, comment, scores);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPublishedReviewsForCar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.rentalService.getPublishedReviewsForCar(req.params.carId);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  getPublishedReviewsForUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role =
        req.query.role === 'owner' || req.query.role === 'renter'
          ? (req.query.role as 'owner' | 'renter')
          : undefined;
      const data = await this.rentalService.getPublishedReviewsForUser(req.params.userId, role);
      res.json({ success: true, data, count: data.length });
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

  getMyRentalsAsOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const rentals = await this.rentalService.getRentalsForOwner(req.user.id);
      res.json({ success: true, data: rentals, count: rentals.length });
    } catch (error) {
      next(error);
    }
  };

  getLandlordContactForCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { carId } = req.params;
      const data = await this.rentalService.getLandlordContactForCar(carId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getInquiryRenterContactForCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { carId } = req.params;
      const renterId = typeof req.query.renterId === 'string' ? req.query.renterId : undefined;
      if (!renterId) {
        res.status(400).json({ success: false, error: { message: 'Query renterId is required' } });
        return;
      }
      const data = await this.rentalService.getInquiryRenterContactForCarOwner(carId, renterId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getUnreadChatsSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await this.rentalService.getUnreadChatsSummary(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  markConversationRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const body = req.body as {
        kind?: string;
        carId?: string;
        threadRenterUserId?: string;
        rentalId?: string;
      };
      if (!body?.kind) {
        res.status(400).json({ success: false, error: { message: 'Body.kind is required' } });
        return;
      }
      if (body.kind === 'inquiry') {
        if (!body.carId || !body.threadRenterUserId) {
          res.status(400).json({ success: false, error: { message: 'carId and threadRenterUserId required' } });
          return;
        }
        await this.rentalService.markConversationRead(req.user.id, {
          kind: 'inquiry',
          carId: String(body.carId),
          threadRenterUserId: String(body.threadRenterUserId),
        });
      } else if (body.kind === 'rental') {
        if (!body.rentalId) {
          res.status(400).json({ success: false, error: { message: 'rentalId required' } });
          return;
        }
        await this.rentalService.markConversationRead(req.user.id, {
          kind: 'rental',
          rentalId: String(body.rentalId),
        });
      } else {
        res.status(400).json({ success: false, error: { message: 'Invalid kind' } });
        return;
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  getRentalMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { id } = req.params;
      const data = await this.rentalService.getRentalMessages(id, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  postRentalMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { id } = req.params;
      const body = typeof req.body?.body === 'string' ? req.body.body : '';
      const data = await this.rentalService.postRentalMessage(id, req.user.id, body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMyInquiryChatsAsOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await this.rentalService.getMyInquiryChatsAsOwner(req.user.id);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  getCarInquiryThreads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { carId } = req.params;
      const data = await this.rentalService.getCarInquiryThreadsForOwner(carId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getCarInquiryMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { carId } = req.params;
      const renterId = typeof req.query.renterId === 'string' ? req.query.renterId : undefined;
      const data = await this.rentalService.getCarInquiryMessages(carId, req.user.id, renterId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  postCarInquiryMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const { carId } = req.params;
      const body = typeof req.body?.body === 'string' ? req.body.body : '';
      const threadRenterUserId =
        typeof req.body?.threadRenterUserId === 'string' ? req.body.threadRenterUserId : undefined;
      const data = await this.rentalService.postCarInquiryMessage(carId, req.user.id, body, threadRenterUserId);
      res.status(201).json({ success: true, data });
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

  approveBookingAsOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const rental = await this.rentalService.approveRentalByOwner(req.params.id, req.user.id);
      res.json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };

  rejectBookingAsOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const rental = await this.rentalService.rejectRentalByOwner(req.params.id, req.user.id);
      res.json({ success: true, data: rental });
    } catch (error) {
      next(error);
    }
  };
}
