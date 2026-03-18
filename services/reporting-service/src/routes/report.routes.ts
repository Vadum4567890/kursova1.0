import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { ReportService } from '../services/ReportService';

const router = Router();
const reportService = new ReportService();
const controller = new ReportController(reportService);

router.get('/financial', controller.generateFinancialReport);
router.get('/occupancy', controller.generateOccupancyReport);
router.get('/availability', controller.generateAvailabilityReport);
router.get('/cars', controller.generateCarReport);

export default router;

