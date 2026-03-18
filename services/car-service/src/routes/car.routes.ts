import { Router } from 'express';
import { CarController } from '../controllers/CarController';

const router = Router();
const carController = new CarController();

// Public routes
router.get('/search', carController.searchCars);
router.get('/:id', carController.getCarById);
router.get('/:id/images', carController.getCarImages);

// Protected routes (require authentication)
// TODO: Add auth middleware
router.post('/', carController.createCar);
router.get('/owner/:ownerId', carController.getCarsByOwner);
router.put('/:id', carController.updateCar);
router.patch('/:id/status', carController.updateCarStatus);
router.delete('/:id', carController.deleteCar);
router.post('/:id/images', carController.addImage);
router.put('/:id/images/:imageId/primary', carController.setPrimaryImage);
router.post('/:id/pricing', carController.updatePricing);
router.put('/:id/pricing', carController.updatePricing);

// List all cars (with filters)
router.get('/', carController.getAllCars);

export default router;

