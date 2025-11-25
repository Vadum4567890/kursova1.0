import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { validateId, validateClientData } from '../middleware/validation';
import { paginationMiddleware } from '../middleware/pagination';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';
import { container } from '../core/Container';

const router = Router();
const clientService = container.resolve<any>('IClientService');
const clientController = new ClientController(clientService);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: List of all clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), clientController.getAllClients);

/**
 * @swagger
 * /api/clients/phone/{phone}:
 *   get:
 *     summary: Get client by phone
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 */
router.get('/phone/:phone', clientController.getClientByPhone);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 */
router.get('/:id', clientController.getClientById);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateClientData, clientController.createClient);

/**
 * @swagger
 * /api/clients/register:
 *   post:
 *     summary: Register or get existing client
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client registered or retrieved
 */
router.post('/register', clientController.registerOrGetClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client
 *     tags: [Clients]
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
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), validateId, clientController.updateClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Client deleted successfully
 *       404:
 *         description: Client not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), validateId, clientController.deleteClient);

export default router;
