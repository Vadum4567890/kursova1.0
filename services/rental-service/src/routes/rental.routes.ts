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
router.get('/reviews/car/:carId', rentalController.getPublishedReviewsForCar);
router.get('/reviews/user/:userId', rentalController.getPublishedReviewsForUser);
// landlord-contact, inquiry-renter-contact, inquiry-messages — у src/index.ts (повний шлях /api/rentals/...)
router.get('/car/:carId', rentalController.getRentalsByCarId);
router.get('/renter/:renterId', rentalController.getRentalsByRenterId);

// Authenticated renter endpoints
router.get('/me', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyRentals(req, res, next)
);
router.get('/me/owner-bookings', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyRentalsAsOwner(req, res, next)
);
router.get('/me/reviews/eligible', auth, (req: AuthRequest, res, next) =>
  rentalController.getEligibleReviews(req, res, next)
);
router.get('/me/reviews/:id', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyReview(req, res, next)
);
router.get('/me/reviews/:id/status', auth, (req: AuthRequest, res, next) =>
  rentalController.getReviewStatus(req, res, next)
);
router.post('/reviews', auth, (req: AuthRequest, res, next) =>
  rentalController.submitReview(req, res, next)
);
router.patch('/me/reviews/:id', auth, (req: AuthRequest, res, next) =>
  rentalController.updateReview(req, res, next)
);

/** Хаб чатів орендодавця — має бути перед /:id, інакше Express повертає «Cannot GET …». */
router.get('/me/inquiry-chats', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyInquiryChatsAsOwner(req, res, next)
);
router.get('/my/inquiry-chats', auth, (req: AuthRequest, res, next) =>
  rentalController.getMyInquiryChatsAsOwner(req, res, next)
);

router.get('/me/unread-chats', auth, (req: AuthRequest, res, next) =>
  rentalController.getUnreadChatsSummary(req, res, next)
);
router.get('/my/unread-chats', auth, (req: AuthRequest, res, next) =>
  rentalController.getUnreadChatsSummary(req, res, next)
);
router.post('/me/conversations/read', auth, (req: AuthRequest, res, next) =>
  rentalController.markConversationRead(req, res, next)
);
router.post('/my/conversations/read', auth, (req: AuthRequest, res, next) =>
  rentalController.markConversationRead(req, res, next)
);

router.post('/book', auth, (req: AuthRequest, res, next) =>
  rentalController.createBookingForCurrentUser(req, res, next)
);
router.post('/:id/approve', auth, (req: AuthRequest, res, next) =>
  rentalController.approveBookingAsOwner(req, res, next)
);
router.post('/:id/reject', auth, (req: AuthRequest, res, next) =>
  rentalController.rejectBookingAsOwner(req, res, next)
);

router.get('/:id/messages', auth, (req: AuthRequest, res, next) =>
  rentalController.getRentalMessages(req, res, next)
);
router.post('/:id/messages', auth, (req: AuthRequest, res, next) =>
  rentalController.postRentalMessage(req, res, next)
);

router.get('/:id', rentalController.getRentalById);

router.post('/', rentalController.createRental);
router.post('/:id/complete', rentalController.completeRental);
router.post('/:id/cancel', rentalController.cancelRental);

export default router;
