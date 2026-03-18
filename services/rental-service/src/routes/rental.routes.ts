import { Router } from 'express';
import { RentalController } from '../controllers/RentalController';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const rentalController = new RentalController();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'rental-service' }));

router.get('/', rentalController.getAllRentals);
router.get('/active', rentalController.getActiveRentals);
router.get('/car/:carId/booked-dates', rentalController.getBookedDates);
router.get('/car/:carId', rentalController.getRentalsByCarId);
router.get('/renter/:renterId', rentalController.getRentalsByRenterId);

// Authenticated renter endpoints
router.get('/me', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyRentals(req, res, next)
);

router.post('/book', auth, (req: AuthRequest, res, next) =>
  rentalController.createBookingForCurrentUser(req, res, next)
);

router.get('/:id', rentalController.getRentalById);

router.post('/', rentalController.createRental);
router.post('/:id/complete', rentalController.completeRental);
router.post('/:id/cancel', rentalController.cancelRental);

export default router;
