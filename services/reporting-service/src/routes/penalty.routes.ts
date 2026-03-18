import { Router } from 'express';
import { PenaltyController } from '../controllers/PenaltyController';
import { PenaltyService } from '../services/PenaltyService';

const router = Router();
const penaltyService = new PenaltyService();
const controller = new PenaltyController(penaltyService);

router.get('/', controller.getAllPenalties);
router.get('/rental/:rentalId', controller.getPenaltiesByRentalId);
router.get('/rental/:rentalId/total', controller.getTotalPenaltyByRentalId);
router.get('/:id', controller.getPenaltyById);
router.post('/', controller.createPenalty);
router.delete('/:id', controller.deletePenalty);

export default router;

