import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';
import { container } from '../core/Container';

const router = Router();
const reportService = container.resolve<any>('ReportService');
const reportController = new ReportController(reportService);

/**
 * @swagger
 * /api/reports/financial:
 *   get:
 *     summary: Generate financial report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date in ISO format (YYYY-MM-DD) or any valid date string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: End date in ISO format (YYYY-MM-DD) or any valid date string
 *     responses:
 *       200:
 *         description: Financial report generated
 */
router.get('/financial', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), reportController.generateFinancialReport);

/**
 * @swagger
 * /api/reports/occupancy:
 *   get:
 *     summary: Generate occupancy report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Occupancy report generated
 */
router.get('/occupancy', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), reportController.generateOccupancyReport);

/**
 * @swagger
 * /api/reports/availability:
 *   get:
 *     summary: Generate availability report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Availability report generated
 */
router.get('/availability', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), reportController.generateAvailabilityReport);

/**
 * @swagger
 * /api/reports/cars:
 *   get:
 *     summary: Generate car report with occupancy and financial indicators
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date in ISO format (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: End date in ISO format (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Car report generated
 */
router.get('/cars', authenticate, reportController.generateCarReport);

export default router;
