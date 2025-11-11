import { Router } from 'express';
import { PenaltyController } from '../controllers/PenaltyController';

const router = Router();
const penaltyController = new PenaltyController();

router.get('/', penaltyController.getAllPenalties);
router.get('/rental/:rentalId', penaltyController.getPenaltiesByRentalId);
router.get('/rental/:rentalId/total', penaltyController.getTotalPenaltyByRentalId);
router.get('/:id', penaltyController.getPenaltyById);
router.post('/', penaltyController.createPenalty);
router.delete('/:id', penaltyController.deletePenalty);

export default router;

