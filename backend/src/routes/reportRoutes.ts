import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();
const reportController = new ReportController();

router.get('/financial', reportController.generateFinancialReport);
router.get('/occupancy', reportController.generateOccupancyReport);
router.get('/availability', reportController.generateAvailabilityReport);

export default router;

