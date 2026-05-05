import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { AnalyticsService } from '../services/AnalyticsService';
import { auth, requireAdminOrManager } from '../middleware/auth';

const router = Router();
const service = new AnalyticsService();
const controller = new AnalyticsController(service);

router.use(auth);
router.use(requireAdminOrManager);

router.get('/dashboard', controller.getDashboardStats);
router.get('/revenue', controller.getRevenueStats);
router.get('/popular-cars', controller.getPopularCars);
router.get('/top-clients', controller.getTopClients);
router.get('/occupancy-rate', controller.getOccupancyRate);
router.get('/revenue-forecast', controller.getRevenueForecast);

export default router;

