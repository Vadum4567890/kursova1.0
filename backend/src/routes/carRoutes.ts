import { Router } from 'express';
import { CarController } from '../controllers/CarController';

const router = Router();
const carController = new CarController();

router.get('/', carController.getAllCars);
router.get('/available', carController.getAvailableCars);
router.get('/type/:type', carController.getCarsByType);
router.get('/:id', carController.getCarById);
router.post('/', carController.createCar);
router.put('/:id', carController.updateCar);
router.patch('/:id/status', carController.updateCarStatus);
router.delete('/:id', carController.deleteCar);

export default router;

