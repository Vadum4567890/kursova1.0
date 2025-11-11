import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/User.entity';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/users - Get all users (admin only)
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      res.status(200).json({
        data: usersWithoutPasswords
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to get users', 500);
    }
  };

  /**
   * GET /api/users/:id - Get user by ID (admin only)
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await this.userService.getUserById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove password from response
      res.status(200).json({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to get user', 500);
    }
  };

  /**
   * PUT /api/users/:id/role - Update user role (admin only)
   */
  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const { role } = req.body;
      if (!role || !Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role. Must be one of: admin, manager, employee', 400);
      }

      // Prevent changing own role
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id) {
        throw new AppError('Cannot change your own role', 403);
      }

      const updated = await this.userService.updateUserRole(id, { role });
      
      res.status(200).json({
        message: 'User role updated successfully',
        data: {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          role: updated.role,
          fullName: updated.fullName,
          isActive: updated.isActive
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to update user role', 400);
    }
  };

  /**
   * PUT /api/users/:id/status - Update user status (admin only)
   */
  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400);
      }

      // Prevent deactivating own account
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id && !isActive) {
        throw new AppError('Cannot deactivate your own account', 403);
      }

      const updated = await this.userService.updateUserStatus(id, { isActive });
      
      res.status(200).json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          role: updated.role,
          fullName: updated.fullName,
          isActive: updated.isActive
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to update user status', 400);
    }
  };

  /**
   * DELETE /api/users/:id - Delete user (admin only)
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      // Prevent deleting own account
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id) {
        throw new AppError('Cannot delete your own account', 403);
      }

      const result = await this.userService.deleteUser(id);
      if (!result) {
        throw new AppError('Failed to delete user', 500);
      }

      res.status(204).send();
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to delete user', 500);
    }
  };

  /**
   * GET /api/users/role/:role - Get users by role (admin only)
   */
  getUsersByRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;
      if (!role || !Object.values(UserRole).includes(role as UserRole)) {
        throw new AppError('Invalid role. Must be one of: admin, manager, employee', 400);
      }

      const users = await this.userService.getUsersByRole(role as UserRole);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      res.status(200).json({
        data: usersWithoutPasswords
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to get users by role', 500);
    }
  };
}

