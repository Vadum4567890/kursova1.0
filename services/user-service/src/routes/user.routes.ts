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

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Authentication routes (public)
router.post('/auth/google', authController.authenticateWithGoogle.bind(authController));
router.get('/auth/google/url', authController.getGoogleAuthUrl.bind(authController));
router.post('/auth/google/callback', authController.handleGoogleCallback.bind(authController));

// Protected routes
router.get('/me', authMiddleware, userController.getMe.bind(userController));
router.put('/me', authMiddleware, validateDto(UpdateUserDto), userController.updateMe.bind(userController));

router.post('/documents', authMiddleware, validateDto(CreateDocumentDto), userController.createDocument.bind(userController));
router.get('/documents', authMiddleware, userController.getDocuments.bind(userController));
router.get('/documents/:id', authMiddleware, userController.getDocumentById.bind(userController));
router.delete('/documents/:id', authMiddleware, userController.deleteDocument.bind(userController));
router.post('/verify-diia', authMiddleware, userController.verifyDiia.bind(userController));

// Client compatibility routes (absorbed from deprecated client-service)
router.get('/clients/phone/:phone', userController.getClientByPhone.bind(userController));
router.post('/clients/register', userController.registerOrGetClient.bind(userController));
router.get('/clients', userController.listClients.bind(userController));
router.get('/clients/:id', userController.getClientById.bind(userController));
router.post('/clients', userController.createClient.bind(userController));
router.put('/clients/:id', userController.updateClient.bind(userController));
router.delete('/clients/:id', userController.deleteClient.bind(userController));

// Internal/user lookup routes
router.get('/:id', internalOrAuth, userController.getUserById.bind(userController));
router.get('/:id/profile', internalOrAuth, userController.getUserProfile.bind(userController));
router.get('/:id/rating', authMiddleware, userController.getUserRating.bind(userController));

export { router as userRoutes };
