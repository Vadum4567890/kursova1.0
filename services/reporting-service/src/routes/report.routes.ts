import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { ReportService } from '../services/ReportService';
import { auth, requireAdminOrManager } from '../middleware/auth';

const router = Router();
const reportService = new ReportService();
const controller = new ReportController(reportService);

router.use(auth);
router.use(requireAdminOrManager);

router.get('/financial', controller.generateFinancialReport);
router.get('/financial/export', controller.exportFinancialReport);
router.get('/occupancy', controller.generateOccupancyReport);
router.get('/occupancy/export', controller.exportOccupancyReport);
router.get('/availability', controller.generateAvailabilityReport);
router.get('/cars', controller.generateCarReport);
router.get('/cars/export', controller.exportCarReport);

export default router;
