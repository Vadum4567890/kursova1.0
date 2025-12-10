import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validateDto } from '../middleware/validation';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { UpdateProfileDto } from '../dto/UpdateProfileDto';
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

// Protected routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/me', userController.getMe.bind(userController));

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Updated user data
 */
router.put('/me', validateDto(UpdateUserDto), userController.updateMe.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
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
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @swagger
 * /api/users/{id}/profile:
 *   get:
 *     summary: Get user profile
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
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 */
router.get('/:id/profile', userController.getUserProfile.bind(userController));

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
router.get('/:id/rating', userController.getUserRating.bind(userController));

/**
 * @swagger
 * /api/users/documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - docType
 *             properties:
 *               docType:
 *                 type: string
 *                 enum: [passport, driving_license, tax_id, other]
 *               docNumber:
 *                 type: string
 *               docImageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserDocument'
 */
router.post('/documents', validateDto(CreateDocumentDto), userController.createDocument.bind(userController));

/**
 * @swagger
 * /api/users/documents:
 *   get:
 *     summary: Get all user documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserDocument'
 */
router.get('/documents', userController.getDocuments.bind(userController));

/**
 * @swagger
 * /api/users/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
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
 *         description: Document data
 *       404:
 *         description: Document not found
 */
router.get('/documents/:id', userController.getDocumentById.bind(userController));

/**
 * @swagger
 * /api/users/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
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
 *       204:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 */
router.delete('/documents/:id', userController.deleteDocument.bind(userController));

/**
 * @swagger
 * /api/users/verify-diia:
 *   post:
 *     summary: Verify user via Дія API
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diiaData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.post('/verify-diia', userController.verifyDiia.bind(userController));

export { router as userRoutes };

