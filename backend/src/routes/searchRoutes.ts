import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';
import { container } from '../core/Container';

const router = Router();
const searchService = container.resolve<any>('SearchService');
const searchController = new SearchController(searchService);

/**
 * @swagger
 * /api/search/cars:
 *   post:
 *     summary: Search cars by multiple criteria
 *     tags: [Search]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [economy, business, premium]
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance]
 *               minPrice:
 *                 type: number
 *               maxPrice:
 *                 type: number
 *               minYear:
 *                 type: integer
 *               maxYear:
 *                 type: integer
 *     responses:
 *       200:
 *         description: List of matching cars
 */
router.post('/cars', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), searchController.searchCars);

/**
 * @swagger
 * /api/search/clients:
 *   get:
 *     summary: Search clients by name, phone or address
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching clients
 */
router.get('/clients', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), searchController.searchClients);

/**
 * @swagger
 * /api/search/rentals:
 *   post:
 *     summary: Search rentals by multiple criteria
 *     tags: [Search]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: integer
 *               carId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: List of matching rentals
 */
router.post('/rentals', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), searchController.searchRentals);

export default router;

