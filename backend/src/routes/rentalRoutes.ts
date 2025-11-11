import { Router } from 'express';
import { RentalController } from '../controllers/RentalController';

const router = Router();
const rentalController = new RentalController();

router.get('/', rentalController.getAllRentals);
router.get('/active', rentalController.getActiveRentals);
router.get('/client/:clientId', rentalController.getRentalsByClientId);
router.get('/car/:carId', rentalController.getRentalsByCarId);
router.get('/:id', rentalController.getRentalById);
router.post('/', rentalController.createRental);
router.post('/:id/complete', rentalController.completeRental);
router.post('/:id/cancel', rentalController.cancelRental);
router.post('/:id/penalty', rentalController.addPenalty);

export default router;

