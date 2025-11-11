import { Router } from 'express';
import { CarController } from '../controllers/CarController';
import { validateId, validateCarData, validateCarStatus } from '../middleware/validation';
import { paginationMiddleware } from '../middleware/pagination';
import { filteringMiddleware } from '../middleware/filtering';

const router = Router();
const carController = new CarController();

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of all cars
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 */
router.get('/', paginationMiddleware, filteringMiddleware(['type', 'status', 'brand', 'model']), carController.getAllCars);

/**
 * @swagger
 * /api/cars/available:
 *   get:
 *     summary: Get available cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of available cars
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 */
router.get('/available', paginationMiddleware, filteringMiddleware(['type', 'brand']), carController.getAvailableCars);

/**
 * @swagger
 * /api/cars/type/{type}:
 *   get:
 *     summary: Get cars by type
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [economy, business, premium]
 *     responses:
 *       200:
 *         description: List of cars by type
 */
router.get('/type/:type', paginationMiddleware, carController.getCarsByType);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get('/:id', validateId, carController.getCarById);

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created successfully
 */
router.post('/', validateCarData, carController.createCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update car
 *     tags: [Cars]
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
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       200:
 *         description: Car updated successfully
 */
router.put('/:id', validateId, carController.updateCar);

/**
 * @swagger
 * /api/cars/{id}/status:
 *   patch:
 *     summary: Update car status
 *     tags: [Cars]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', validateId, carController.updateCarStatus);

/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Car deleted successfully
 *       404:
 *         description: Car not found
 */
router.delete('/:id', validateId, carController.deleteCar);

export default router;

