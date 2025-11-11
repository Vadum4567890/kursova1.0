import { Router } from 'express';
import { PenaltyController } from '../controllers/PenaltyController';

const router = Router();
const penaltyController = new PenaltyController();

/**
 * @swagger
 * /api/penalties:
 *   get:
 *     summary: Get all penalties
 *     tags: [Penalties]
 *     responses:
 *       200:
 *         description: List of all penalties
 */
router.get('/', penaltyController.getAllPenalties);

/**
 * @swagger
 * /api/penalties/rental/{rentalId}:
 *   get:
 *     summary: Get penalties by rental ID
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of penalties for rental
 */
router.get('/rental/:rentalId', penaltyController.getPenaltiesByRentalId);

/**
 * @swagger
 * /api/penalties/rental/{rentalId}/total:
 *   get:
 *     summary: Get total penalty amount for rental
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Total penalty amount
 */
router.get('/rental/:rentalId/total', penaltyController.getTotalPenaltyByRentalId);

/**
 * @swagger
 * /api/penalties/{id}:
 *   get:
 *     summary: Get penalty by ID
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Penalty details
 */
router.get('/:id', penaltyController.getPenaltyById);

/**
 * @swagger
 * /api/penalties:
 *   post:
 *     summary: Create a new penalty
 *     tags: [Penalties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rentalId
 *               - amount
 *               - reason
 *             properties:
 *               rentalId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Penalty created successfully
 */
router.post('/', penaltyController.createPenalty);

/**
 * @swagger
 * /api/penalties/{id}:
 *   delete:
 *     summary: Delete penalty
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Penalty deleted successfully
 */
router.delete('/:id', penaltyController.deletePenalty);

export default router;
