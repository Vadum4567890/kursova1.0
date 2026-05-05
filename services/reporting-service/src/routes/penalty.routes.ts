import { Router } from 'express';
import { PenaltyController } from '../controllers/PenaltyController';
import { PenaltyService } from '../services/PenaltyService';
import { auth, AuthRequest, requireStaff } from '../middleware/auth';

const router = Router();
const penaltyService = new PenaltyService();
const controller = new PenaltyController(penaltyService);

router.get('/me', auth, (req: AuthRequest, res, next) => controller.getMyPenalties(req, res, next));

router.get('/', auth, requireStaff, controller.getAllPenalties);
router.get('/rental/:rentalId/total', auth, requireStaff, controller.getTotalPenaltyByRentalId);
router.get('/rental/:rentalId', auth, requireStaff, controller.getPenaltiesByRentalId);
router.get('/:id', auth, requireStaff, controller.getPenaltyById);
router.post('/', auth, requireStaff, controller.createPenalty);
router.delete('/:id', auth, requireStaff, controller.deletePenalty);

export default router;
