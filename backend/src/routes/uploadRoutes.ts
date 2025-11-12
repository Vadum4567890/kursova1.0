import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();
const uploadController = new UploadController();

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload image file (admin/manager only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     mimetype:
 *                       type: string
 *                     url:
 *                       type: string
 *                     fullUrl:
 *                       type: string
 *       400:
 *         description: Invalid file type or no file uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin or manager role)
 */
router.post('/image', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), uploadSingle, uploadController.uploadImage);

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple image files (admin/manager only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (JPEG, PNG, GIF, WebP, max 5MB each, max 10 files)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       mimetype:
 *                         type: string
 *                       url:
 *                         type: string
 *                       fullUrl:
 *                         type: string
 *       400:
 *         description: Invalid file type or no files uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin or manager role)
 */
router.post('/images', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), uploadMultiple, uploadController.uploadImages);

/**
 * @swagger
 * /api/upload/image/{filename}:
 *   delete:
 *     summary: Delete uploaded image (admin/manager only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin or manager role)
 *       404:
 *         description: Image not found
 */
router.delete('/image/:filename', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), uploadController.deleteImage);

export default router;

