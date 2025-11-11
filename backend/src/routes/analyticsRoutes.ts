import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

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
router.get('/dashboard', analyticsController.getDashboardStats);

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
router.get('/revenue', analyticsController.getRevenueStats);

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
router.get('/popular-cars', analyticsController.getPopularCars);

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
router.get('/top-clients', analyticsController.getTopClients);

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
router.get('/occupancy-rate', analyticsController.getOccupancyRate);

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
router.get('/revenue-forecast', analyticsController.getRevenueForecast);

export default router;

