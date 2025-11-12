import { Router } from 'express';
import { RentalController } from '../controllers/RentalController';
import { validateId, validateRentalData, validatePenaltyData } from '../middleware/validation';
import { paginationMiddleware } from '../middleware/pagination';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';

const router = Router();
const rentalController = new RentalController();

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Get all rentals
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: List of all rentals
 */
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), rentalController.getAllRentals);

/**
 * @swagger
 * /api/rentals/active:
 *   get:
 *     summary: Get active rentals
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: List of active rentals
 */
router.get('/active', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), rentalController.getActiveRentals);

/**
 * @swagger
 * /api/rentals/client/{clientId}:
 *   get:
 *     summary: Get rentals by client ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of client rentals
 */
router.get('/client/:clientId', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, rentalController.getRentalsByClientId);

/**
 * @swagger
 * /api/rentals/car/{carId}:
 *   get:
 *     summary: Get rentals by car ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of car rentals
 */
router.get('/car/:carId', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, rentalController.getRentalsByCarId);

/**
 * @swagger
 * /api/rentals/my:
 *   get:
 *     summary: Get rentals for current user (USER role)
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: List of user's rentals
 */
router.get('/my', authenticate, rentalController.getMyRentals);

/**
 * @swagger
 * /api/rentals/{id}:
 *   get:
 *     summary: Get rental by ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rental details
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, rentalController.getRentalById);

/**
 * @swagger
 * /api/rentals:
 *   post:
 *     summary: Create a new rental
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - carId
 *               - startDate
 *               - expectedEndDate
 *             properties:
 *               clientId:
 *                 type: integer
 *               carId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expectedEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Rental created successfully
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateRentalData, rentalController.createRental);

/**
 * @swagger
 * /api/rentals/{id}/complete:
 *   post:
 *     summary: Complete a rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Rental completed successfully
 */
router.post('/:id/complete', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, rentalController.completeRental);

/**
 * @swagger
 * /api/rentals/book:
 *   post:
 *     summary: Create booking for user (USER role)
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carId
 *               - startDate
 *               - expectedEndDate
 *             properties:
 *               carId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expectedEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/book', authenticate, rentalController.createBooking);

/**
 * @swagger
 * /api/rentals/{id}/cancel:
 *   post:
 *     summary: Cancel a rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rental cancelled successfully
 */
router.post('/:id/cancel', authenticate, validateId, rentalController.cancelRental);

/**
 * @swagger
 * /api/rentals/{id}/penalty:
 *   post:
 *     summary: Add penalty to rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Penalty added successfully
 */
router.post('/:id/penalty', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, validatePenaltyData, rentalController.addPenalty);

export default router;
