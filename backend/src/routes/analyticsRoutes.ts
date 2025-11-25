import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';

const router = Router();
const analyticsController = new AnalyticsController();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue statistics
 */
router.get('/revenue', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getRevenueStats);

/**
 * @swagger
 * /api/analytics/popular-cars:
 *   get:
 *     summary: Get most popular cars
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of popular cars
 */
router.get('/popular-cars', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getPopularCars);

/**
 * @swagger
 * /api/analytics/top-clients:
 *   get:
 *     summary: Get top clients by spending
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of top clients
 */
router.get('/top-clients', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getTopClients);

/**
 * @swagger
 * /api/analytics/occupancy-rate:
 *   get:
 *     summary: Get car occupancy rate
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Occupancy rate percentage
 */
router.get('/occupancy-rate', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getOccupancyRate);

/**
 * @swagger
 * /api/analytics/revenue-forecast:
 *   get:
 *     summary: Get revenue forecast for next month
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Revenue forecast
 */
router.get('/revenue-forecast', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), analyticsController.getRevenueForecast);

export default router;

