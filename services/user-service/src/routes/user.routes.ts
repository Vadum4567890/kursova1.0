import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { internalOrAuth } from '../middleware/internalOrAuth';
import { validateDto } from '../middleware/validation';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { CreateDocumentDto } from '../dto/CreateDocumentDto';

const router = Router();
const userController = new UserController();
const authController = new AuthController();

/**
 * @swagger
 * /api/users/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Authentication routes (public)
router.post('/auth/google', authController.authenticateWithGoogle.bind(authController));
router.get('/auth/google/url', authController.getGoogleAuthUrl.bind(authController));
router.post('/auth/google/callback', authController.handleGoogleCallback.bind(authController));

// Protected routes (Bearer or X-Service-Key for GET by id/profile)
router.get('/me', authMiddleware, userController.getMe.bind(userController));
router.put('/me', authMiddleware, validateDto(UpdateUserDto), userController.updateMe.bind(userController));

router.post('/documents', authMiddleware, validateDto(CreateDocumentDto), userController.createDocument.bind(userController));
router.get('/documents', authMiddleware, userController.getDocuments.bind(userController));
router.get('/documents/:id', authMiddleware, userController.getDocumentById.bind(userController));
router.delete('/documents/:id', authMiddleware, userController.deleteDocument.bind(userController));

router.post('/verify-diia', authMiddleware, userController.verifyDiia.bind(userController));

/** GET by UUID — allowed with Bearer or X-Service-Key (internal calls from monolith/car-service) */
router.get('/:id', internalOrAuth, userController.getUserById.bind(userController));
router.get('/:id/profile', internalOrAuth, userController.getUserProfile.bind(userController));

/**
 * @swagger
 * /api/users/{id}/rating:
 *   get:
 *     summary: Get user rating
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User rating data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserRating'
 */
router.get('/:id/rating', authMiddleware, userController.getUserRating.bind(userController));

export { router as userRoutes };

