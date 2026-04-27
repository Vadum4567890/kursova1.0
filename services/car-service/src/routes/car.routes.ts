import { Router } from 'express';
import { CarController } from '../controllers/CarController';
import { requireJwtUser, optionalJwtUser } from '../middleware/jwtUser';

const router = Router();
const carController = new CarController();

/** Статичні сегменти ПЕРЕД /:id, інакше "available" трактується як id */
router.get('/search', carController.searchCars);
router.get('/available', carController.getAvailableCars);
router.get('/type/:category', carController.getCarsByCategoryParam);
router.get('/my', requireJwtUser, carController.getMyCars);
router.get('/', carController.getAllCars);
router.get('/owner/:ownerId', carController.getCarsByOwner);

router.get('/:id/images', carController.getCarImages);
router.get('/:id/rating', carController.getCarRating);
router.get('/:id', carController.getCarById);

router.post('/', optionalJwtUser, carController.createCar);
router.put('/:id', requireJwtUser, carController.updateCar);
router.patch('/:id/status', carController.updateCarStatus);
router.delete('/:id', requireJwtUser, carController.deleteCar);
router.post('/:id/images', requireJwtUser, carController.addImage);
router.put('/:id/images/:imageId/primary', requireJwtUser, carController.setPrimaryImage);
router.post('/:id/pricing', requireJwtUser, carController.updatePricing);
router.put('/:id/pricing', requireJwtUser, carController.updatePricing);
router.post('/:id/rating/completed-rental', carController.incrementCompletedRentals);
router.post('/:id/rating/aggregate', carController.applyPublishedReviewAggregate);

export default router;
