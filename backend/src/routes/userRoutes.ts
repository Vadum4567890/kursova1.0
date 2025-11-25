import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';
import { validateId } from '../middleware/validation';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *         fullName:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UpdateRoleRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *     UpdateStatusRequest:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role)
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), userController.getAllUsers);

/**
 * @swagger
 * /api/users/role/{role}:
 *   get:
 *     summary: Get users by role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, manager, employee]
 *     responses:
 *       200:
 *         description: List of users with specified role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role)
 */
router.get('/role/:role', authenticate, authorize(UserRole.ADMIN), userController.getUsersByRole);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role)
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN), validateId, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *           example:
 *             role: "manager"
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role or cannot change own role)
 *       404:
 *         description: User not found
 */
router.put('/:id/role', authenticate, authorize(UserRole.ADMIN), validateId, userController.updateUserRole);

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Update user status - activate/deactivate (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role or cannot deactivate own account)
 *       404:
 *         description: User not found
 */
router.put('/:id/status', authenticate, authorize(UserRole.ADMIN), validateId, userController.updateUserStatus);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role or cannot delete own account)
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), validateId, userController.deleteUser);

export default router;

